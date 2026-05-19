#!/usr/bin/env node
/**
 * Full iOS release pipeline:
 *   1. Bump the semver version + buildNumber in app.json
 *   2. Copy the artifact to /tmp (avoids Replit's large workspace + git restrictions)
 *   3. Generate a standalone package.json (catalog: resolved, workspace: deps removed)
 *   4. Init a fresh git repo in /tmp so EAS can archive the project
 *   5. EAS build (production, non-interactive) — captures build URL
 *   6. EAS submit (production, non-interactive)
 *   7. Send a push notification via ntfy.sh on success OR failure
 *   8. Clean up the /tmp directory
 *
 * Flags:
 *   --dry-run   Run Steps 1-4 only (version bump, rsync copy, standalone package.json,
 *               git init), print the resolved package.json to stdout, then exit without
 *               calling EAS. Useful for verifying the build setup without spending credits.
 *   --minor     Bump the minor version instead of the default patch bump.
 *   --major     Bump the major version instead of the default patch bump.
 *
 * Set NOTIFY_TOPIC in Replit Secrets (e.g. "onjjem-builds-skeff001").
 * Install the free ntfy app on your iPhone and subscribe to that topic.
 * If NOTIFY_TOPIC is not set the release still runs — notifications are skipped.
 */

"use strict";

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const https = require("https");

const ARTIFACT_DIR = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(ARTIFACT_DIR, "../..");
const WORKSPACE_YAML = path.join(WORKSPACE_ROOT, "pnpm-workspace.yaml");

const APP_NAME = "ONJJEM Photo Restoration";
const EAS_URL_RE = /https:\/\/expo\.dev\/accounts\/[^\s]+/;

// Accept an optional --minor or --major flag and forward it to bump-version.js
const BUMP_FLAG = process.argv.includes("--major")
  ? "--major"
  : process.argv.includes("--minor")
    ? "--minor"
    : null;

// When --dry-run is passed, Steps 1-4 run but EAS is never called.
const DRY_RUN = process.argv.includes("--dry-run");

// ── Notification helper ──────────────────────────────────────────────────────

function notify(title, message, { priority = "default", tags = [] } = {}) {
  return new Promise((resolve) => {
    const topic = process.env.NOTIFY_TOPIC;
    if (!topic) {
      console.log(`[notify] NOTIFY_TOPIC not set — skipping: ${title}`);
      return resolve();
    }

    const body = JSON.stringify({ topic, title, message, priority, tags });

    const req = https.request(
      {
        hostname: "ntfy.sh",
        port: 443,
        path: "/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume();
        res.on("end", resolve);
      },
    );

    req.on("error", (err) => {
      console.warn(`[notify] Failed to send notification: ${err.message}`);
      resolve();
    });

    req.write(body);
    req.end();
  });
}

// ── Process runner ───────────────────────────────────────────────────────────

function runCapture(cmd, args, cwd) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    encoding: "utf8",
  });

  const out = result.stdout ?? "";
  const err = result.stderr ?? "";
  const combined = (out + "\n" + err).trim();

  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);

  return { status: result.status ?? 1, combined };
}

function extractBuildUrl(text) {
  const m = text.match(EAS_URL_RE);
  return m ? m[0] : null;
}

function trimError(text) {
  if (!text) return "No additional details.";
  const t = text.trim();
  return t.length <= 400 ? t : "…" + t.slice(-400);
}

// ── catalog: resolver ────────────────────────────────────────────────────────

/**
 * Parse the `catalog:` block from pnpm-workspace.yaml.
 * Returns a plain object: { packageName: resolvedVersion, ... }
 */
function parseCatalog(yamlPath) {
  const raw = fs.readFileSync(yamlPath, "utf8");

  // Find the catalog: block — it's a top-level YAML mapping
  const catalogMatch = raw.match(/^catalog:\s*\n((?:[ \t]+[^\n]*\n?)*)/m);
  if (!catalogMatch) return {};

  const catalog = {};
  for (const line of catalogMatch[1].split("\n")) {
    // Lines look like:  '  react: 19.1.0'  or  "  '@tanstack/react-query': ^5.90.0"
    const m = line.match(/^\s+['"]?(@?[\w/.-]+(?:\/[\w/.-]+)*)['"]?\s*:\s*(.+?)\s*$/);
    if (m) {
      catalog[m[1]] = m[2].replace(/^['"]|['"]$/g, ""); // strip any surrounding quotes
    }
  }

  return catalog;
}

/**
 * Build a standalone package.json suitable for an isolated /tmp EAS build:
 *   - catalog: entries are resolved to real semver strings
 *   - workspace:* entries are dropped (not available outside the monorepo)
 */
function buildStandalonePackageJson(pkgPath, catalog) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  const missing = [];

  function resolveDeps(deps) {
    if (!deps) return {};
    const out = {};
    for (const [name, ver] of Object.entries(deps)) {
      if (ver === "catalog:" || ver.startsWith("catalog:")) {
        const resolved = catalog[name];
        if (resolved) {
          out[name] = resolved;
        } else {
          missing.push(name);
        }
      } else if (ver.startsWith("workspace:")) {
        console.log(`[skip] workspace dep "${name}" — not available outside monorepo`);
      } else {
        out[name] = ver;
      }
    }
    return out;
  }

  const resolvedDeps = resolveDeps(pkg.dependencies);
  const resolvedDevDeps = resolveDeps(pkg.devDependencies);

  if (missing.length > 0) {
    throw new Error(
      `Cannot build standalone package.json — the following catalog: entries have no ` +
      `matching version in pnpm-workspace.yaml:\n  ${missing.join("\n  ")}\n` +
      `Add them to the catalog: block in pnpm-workspace.yaml and try again.`,
    );
  }

  return {
    name: pkg.name,
    version: pkg.version,
    private: true,
    main: pkg.main,
    scripts: pkg.scripts ?? {},
    dependencies: resolvedDeps,
    devDependencies: resolvedDevDeps,
  };
}

// ── Version preview ───────────────────────────────────────────────────────────

/**
 * Read app.json and calculate the next version + buildNumber without writing
 * anything. Returns { currentVersion, nextVersion, currentBuild, nextBuild }.
 */
function previewNextVersion() {
  const appJson = JSON.parse(
    fs.readFileSync(path.join(ARTIFACT_DIR, "app.json"), "utf8"),
  );
  const currentVersion = appJson.expo.version;
  const currentBuild = parseInt(appJson.expo?.ios?.buildNumber ?? "0", 10);

  const parts = currentVersion.split(".").map(Number);
  if (BUMP_FLAG === "--major") {
    parts[0] += 1; parts[1] = 0; parts[2] = 0;
  } else if (BUMP_FLAG === "--minor") {
    parts[1] += 1; parts[2] = 0;
  } else {
    parts[2] += 1;
  }

  return {
    currentVersion,
    nextVersion: parts.join("."),
    currentBuild,
    nextBuild: currentBuild + 1,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let tmpDir = null;

  try {
    // ── Version preview (before any file changes) ──────────────────────────────
    const { currentVersion, nextVersion, currentBuild, nextBuild } =
      previewNextVersion();
    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log(  "║              ONJJEM Photo Restoration           ║");
    console.log(  "╠══════════════════════════════════════════════════╣");
    console.log(`║  Current : ${currentVersion} (build ${currentBuild})`.padEnd(51) + "║");
    console.log(`║  Release : ${nextVersion} (build ${nextBuild})`.padEnd(51) + "║");
    if (DRY_RUN) {
    console.log(  "║  Mode    : DRY RUN — EAS build/submit skipped    ║");
    }
    console.log(  "╚══════════════════════════════════════════════════╝\n");

    // ── Step 1: bump version ───────────────────────────────────────────────────
    console.log("\n=== Step 1: bump version ===");
    const bumpCmd = BUMP_FLAG
      ? `node scripts/bump-version.js ${BUMP_FLAG}`
      : "node scripts/bump-version.js";
    try {
      execSync(bumpCmd, { cwd: ARTIFACT_DIR, stdio: "inherit" });
    } catch (err) {
      await notify(
        `${APP_NAME} — Release failed ❌`,
        `Version bump failed before build started.\n\n${trimError(String(err))}`,
        { priority: "high", tags: ["rotating_light"] },
      );
      process.exit(1);
    }

    // ── Step 2: create isolated /tmp build directory ───────────────────────────
    console.log("\n=== Step 2: copy artifact to /tmp ===");
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eas-release-"));
    console.log(`Build directory: ${tmpDir}`);

    execSync(
      [
        "rsync -a",
        "--exclude='node_modules'",
        "--exclude='.expo'",
        "--exclude='.git'",
        "--exclude='.replit-artifact'",
        "--exclude='server'",       // API server — not needed for Expo build
        `"${ARTIFACT_DIR}/" "${tmpDir}/"`,
      ].join(" "),
      { stdio: "inherit" },
    );
    console.log("Files copied.");

    // ── Step 3: generate standalone package.json ───────────────────────────────
    console.log("\n=== Step 3: generate standalone package.json ===");
    const catalog = parseCatalog(WORKSPACE_YAML);
    const standalonePkg = buildStandalonePackageJson(
      path.join(ARTIFACT_DIR, "package.json"),
      catalog,
    );
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify(standalonePkg, null, 2) + "\n",
      "utf8",
    );
    console.log("Standalone package.json written.");

    // ── Step 4: initialise git repo ────────────────────────────────────────────
    console.log("\n=== Step 4: initialise git repo in /tmp ===");
    execSync("git init && git add -A && git commit -m 'release'", {
      cwd: tmpDir,
      stdio: "inherit",
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "release-script",
        GIT_AUTHOR_EMAIL: "release@local",
        GIT_COMMITTER_NAME: "release-script",
        GIT_COMMITTER_EMAIL: "release@local",
      },
    });
    console.log("Git repo initialised.");

    // ── Dry-run exit ───────────────────────────────────────────────────────────
    if (DRY_RUN) {
      console.log("\n=== DRY RUN — Steps 1-4 complete. Resolved package.json: ===");
      const resolvedPkg = fs.readFileSync(path.join(tmpDir, "package.json"), "utf8");
      console.log(resolvedPkg);
      console.log("=== DRY RUN complete — EAS build/submit skipped. ===\n");
      return;
    }

    // ── Step 5: EAS build ──────────────────────────────────────────────────────
    console.log("\n=== Step 5: EAS build ===");
    const { status: buildStatus, combined: buildOutput } = runCapture(
      "eas",
      ["build", "--platform", "ios", "--profile", "production", "--non-interactive"],
      tmpDir,
    );

    const buildUrl = extractBuildUrl(buildOutput);

    if (buildStatus !== 0) {
      await notify(
        `${APP_NAME} — Build failed ❌`,
        `EAS build exited with code ${buildStatus}.\n\n${trimError(buildOutput)}`,
        { priority: "high", tags: ["rotating_light"] },
      );
      process.exit(buildStatus);
    }

    // ── Step 6: EAS submit ─────────────────────────────────────────────────────
    console.log("\n=== Step 6: EAS submit ===");
    const { status: submitStatus, combined: submitOutput } = runCapture(
      "eas",
      ["submit", "--platform", "ios", "--profile", "production", "--non-interactive"],
      tmpDir,
    );

    if (submitStatus !== 0) {
      await notify(
        `${APP_NAME} — Submit failed ❌`,
        `Build succeeded but submission exited with code ${submitStatus}.\n\n${trimError(submitOutput)}`,
        { priority: "high", tags: ["rotating_light"] },
      );
      process.exit(submitStatus);
    }

    // ── Success ────────────────────────────────────────────────────────────────
    const successMsg = buildUrl
      ? `New build submitted to App Store Connect.\n\nBuild URL:\n${buildUrl}`
      : "New build submitted to App Store Connect. Check expo.dev for build details.";

    await notify(`${APP_NAME} — Submitted ✅`, successMsg, {
      priority: "default",
      tags: ["white_check_mark", "iphone"],
    });

    console.log("\n✅  Release pipeline complete — build submitted to App Store Connect.");
    if (buildUrl) console.log(`    Build URL: ${buildUrl}`);
  } finally {
    if (tmpDir) {
      console.log(`\n=== Cleaning up ${tmpDir} ===`);
      try {
        execSync(`rm -rf "${tmpDir}"`, { stdio: "inherit" });
        console.log("Cleanup complete.");
      } catch (e) {
        console.warn(`[warn] Cleanup failed: ${e.message}`);
      }
    }
  }
}

main().catch(async (err) => {
  await notify(
    `${APP_NAME} — Unexpected error ❌`,
    String(err),
    { priority: "urgent", tags: ["rotating_light"] },
  );
  console.error(err);
  process.exit(1);
});
