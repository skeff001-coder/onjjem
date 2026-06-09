#!/usr/bin/env node
/**
 * Full iOS release pipeline:
 *   1. Bump the semver version + buildNumber in app.json
 *   2. Copy the artifact to /tmp (avoids Replit's large workspace)
 *   3. Generate a standalone package.json (catalog: resolved, workspace: deps removed)
 *   4. EAS build (production, non-interactive, EAS_NO_VCS=1) — captures build URL
 *   5. EAS submit (production, non-interactive)
 *   6. Send a push notification via ntfy.sh on success OR failure
 *   7. Clean up the /tmp directory
 *
 * Note: EAS_NO_VCS=1 is set automatically — no git repo is needed in /tmp.
 * EAS uses a shallow file copy instead of git archive to upload source.
 *
 * Flags:
 *   --preview   Read-only sanity check: shows the version that would be published,
 *               the list of files that would be synced, and any missing env vars.
 *               No files are created or modified. Use this before committing to a release.
 *   --dry-run   Run Steps 1-3 only (version bump, copy to /tmp, standalone package.json),
 *               print the resolved package.json to stdout, then exit without calling EAS.
 *               Useful for verifying the build setup without spending credits.
 *   --minor     Bump the minor version instead of the default patch bump.
 *   --major     Bump the major version instead of the default patch bump.
 *   --yes       Skip all interactive prompts (the "Press Enter to continue" pause after
 *               the version preview AND the final "Continue? [y/N]" confirmation).
 *               Alias: --no-confirm. Use in non-interactive / CI environments, or when
 *               you're confident the version preview looks correct.
 *
 * Set NOTIFY_TOPIC in Replit Secrets (e.g. "onjjem-builds-skeff001").
 * Install the free ntfy app on your iPhone and subscribe to that topic.
 * If NOTIFY_TOPIC is not set the release still runs — notifications are skipped.
 *
 * Set NOTIFY_EMAIL in Replit Secrets to also receive an email when the build
 * succeeds or fails. ntfy.sh forwards each notification to that address for free.
 * NOTIFY_EMAIL works with or without NOTIFY_TOPIC.
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

// When --preview is passed, nothing is written — only a release summary is printed.
const PREVIEW = process.argv.includes("--preview");

// When --skip-bump is passed, Step 1 (version bump) is skipped entirely.
// Use this when the version has already been bumped in a previous run.
const SKIP_BUMP = process.argv.includes("--skip-bump");

// When --yes / --no-confirm is passed (or stdin is not a TTY), skip all prompts.
const YES =
  process.argv.includes("--yes") ||
  process.argv.includes("--no-confirm") ||
  !process.stdin.isTTY;

// ── Notification helper ──────────────────────────────────────────────────────

function notify(title, message, { priority = "default", tags = [] } = {}) {
  return new Promise((resolve) => {
    const topic = process.env.NOTIFY_TOPIC;
    const email = process.env.NOTIFY_EMAIL;

    if (!topic && !email) {
      console.log(`[notify] NOTIFY_TOPIC and NOTIFY_EMAIL not set — skipping: ${title}`);
      return resolve();
    }

    // ntfy.sh requires a topic even when only forwarding to email.
    // Use a deterministic fallback so email-only mode still works.
    const effectiveTopic = topic || "owens-photofix-email-only";

    const payload = { topic: effectiveTopic, title, message, priority, tags };
    if (email) payload.email = email;

    const body = JSON.stringify(payload);

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

function runCapture(cmd, args, cwd, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    encoding: "utf8",
    env: { ...process.env, ...extraEnv },
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
 *   - eas-cli is dropped (it ships native deps like better-sqlite3 that crash
 *     npm ci on the EAS Mac worker; EAS provides its own CLI infrastructure)
 */
function buildStandalonePackageJson(pkgPath, catalog) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

  // Packages that must never be sent to EAS workers.
  // - eas-cli: pulls in better-sqlite3 (native addon) that crashes npm ci on macOS
  // - @expo/ngrok: postinstall downloads a platform binary that crashes npm on macOS Sequoia
  const EAS_WORKER_EXCLUDE = new Set(["eas-cli", "@expo/ngrok"]);

  const missing = [];

  function resolveDeps(deps) {
    if (!deps) return {};
    const out = {};
    for (const [name, ver] of Object.entries(deps)) {
      if (EAS_WORKER_EXCLUDE.has(name)) {
        console.log(`[skip] "${name}" — excluded from EAS worker package.json`);
        continue;
      }
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

// ── Confirmation prompt ───────────────────────────────────────────────────────

/**
 * Ask "Continue? [y/N]" on stdout/stdin.
 * Resolves true if the user answers y/Y, false otherwise.
 * Skipped automatically when YES is true (--yes flag or non-interactive TTY).
 */
function askConfirm(question) {
  return new Promise((resolve) => {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

/**
 * Pause and wait for the user to press Enter before proceeding.
 * Pressing Ctrl+C will raise SIGINT, terminating the process cleanly
 * without modifying any files.
 * Skipped automatically when YES is true (--yes flag or non-interactive TTY).
 */
function askContinue() {
  return new Promise((resolve) => {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    // Restore normal Ctrl+C behaviour so the user can abort cleanly.
    rl.on("SIGINT", () => {
      rl.close();
      console.log("\nAborted — no files were changed.");
      process.exit(0);
    });
    rl.question("Press Enter to continue, or Ctrl+C to abort… ", () => {
      rl.close();
      resolve();
    });
  });
}

// ── Preview helpers ───────────────────────────────────────────────────────────

/**
 * Walk ARTIFACT_DIR and list the files that would be copied to /tmp,
 * honouring the same exclusions as the real copy step.
 * Returns { files: string[], error: string | null }
 */
function listFilesToSync() {
  const EXCLUDE = new Set(["node_modules", ".expo", ".git", ".replit-artifact", "server"]);
  const files = [];
  function walk(dir, rel) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const name = e.name;
      const relPath = rel ? `${rel}/${name}` : name;
      if (EXCLUDE.has(name)) continue;
      if (e.isDirectory()) { walk(path.join(dir, name), relPath); }
      else { files.push(relPath); }
    }
  }
  try {
    walk(ARTIFACT_DIR, "");
    return { files, error: null };
  } catch (err) {
    return { files: [], error: String(err) };
  }
}

/**
 * Check for required and optional environment variables.
 * Returns { missing: string[], warnings: string[] }
 */
function checkEnvVars() {
  const required = ["EXPO_TOKEN"];
  const optional = [
    { key: "NOTIFY_TOPIC", hint: "push notifications (ntfy app on iPhone) will be skipped" },
    { key: "NOTIFY_EMAIL", hint: "email notifications will be skipped" },
  ];

  const missing = required.filter((v) => !process.env[v]);
  const warnings = optional
    .filter(({ key }) => !process.env[key])
    .map(({ key, hint }) => `${key} not set — ${hint}`);

  return { missing, warnings };
}

// ── CHANGELOG guard ───────────────────────────────────────────────────────────

const WHATS_NEW_PATH = path.join(ARTIFACT_DIR, "components", "WhatsNewModal.tsx");

/**
 * Parse the version keys present in the CHANGELOG object inside WhatsNewModal.tsx.
 * Uses a regex so the TS file doesn't need to be executed.
 * Returns an array of version strings like ["1.0.1", "1.0.2"].
 */
function readChangelogVersions() {
  let src;
  try {
    src = fs.readFileSync(WHATS_NEW_PATH, "utf8");
  } catch {
    return { versions: [], error: `Cannot read ${WHATS_NEW_PATH}` };
  }

  // Find the CHANGELOG object body between the outer braces
  const blockMatch = src.match(/export\s+const\s+CHANGELOG[^=]*=\s*\{([\s\S]*?)\};\s*$/m);
  if (!blockMatch) {
    // Fallback: scan for any quoted semver key at the start of a line
    const keys = [...src.matchAll(/"(\d+\.\d+\.\d+)"\s*:/g)].map((m) => m[1]);
    return { versions: keys, error: null };
  }

  const keys = [...blockMatch[1].matchAll(/"(\d+\.\d+\.\d+)"\s*:/g)].map((m) => m[1]);
  return { versions: keys, error: null };
}

/**
 * Check whether `version` has a CHANGELOG entry.
 * Returns { ok: boolean, versions: string[], error: string | null }
 */
function checkChangelogEntry(version) {
  const { versions, error } = readChangelogVersions();
  return { ok: versions.includes(version), versions, error };
}

/**
 * Insert a generic CHANGELOG entry for `version` at the top of the
 * CHANGELOG object in WhatsNewModal.tsx. Returns true on success, false if
 * the file could not be parsed.
 *
 * The generic entry simply tells users we've shipped improvements and bug
 * fixes — appropriate as a fallback when the release script is invoked
 * without a hand-written entry.
 */
function insertGenericChangelogEntry(version) {
  let src;
  try {
    src = fs.readFileSync(WHATS_NEW_PATH, "utf8");
  } catch {
    return false;
  }

  const entry =
    `  "${version}": {\n` +
    `    headline: "What's New in v${version}",\n` +
    `    items: [\n` +
    `      {\n` +
    `        icon: "sparkles-outline",\n` +
    `        accent: "#C9960C",\n` +
    `        title: "Improvements & Bug Fixes",\n` +
    `        body: "Behind-the-scenes improvements and small fixes to keep your photo restorations running smoothly.",\n` +
    `      },\n` +
    `    ],\n` +
    `  },\n`;

  // Insert right after the opening brace of the CHANGELOG object literal.
  const anchorRe = /(export\s+const\s+CHANGELOG[^=]*=\s*\{\s*\n)/m;
  if (!anchorRe.test(src)) {
    return false;
  }

  const updated = src.replace(anchorRe, (match) => match + entry);
  fs.writeFileSync(WHATS_NEW_PATH, updated, "utf8");
  return true;
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
    if (PREVIEW) {
    console.log(  "║  Mode    : PREVIEW — read-only, no files changed  ║");
    }
    console.log(  "╚══════════════════════════════════════════════════╝\n");

    // ── Early pause — let the user review the version before anything runs ──────
    // Skipped for --preview (exits after the summary), --dry-run (already safe),
    // and --yes / non-interactive environments.
    if (!PREVIEW && !DRY_RUN && !YES) {
      await askContinue();
    }

    // ── Preview mode: read-only summary, then exit ─────────────────────────────
    if (PREVIEW) {
      const { missing, warnings } = checkEnvVars();

      console.log("=== Environment variables ===");
      if (missing.length === 0) {
        console.log("  ✓ EXPO_TOKEN is set");
      } else {
        for (const v of missing) {
          console.log(`  ✗ ${v} is MISSING — release will fail without this`);
        }
      }
      for (const w of warnings) {
        console.log(`  ! ${w}`);
      }

      console.log("\n=== What's New changelog ===");
      const { ok: clOk, versions: clVersions, error: clErr } = checkChangelogEntry(nextVersion);
      if (clErr) {
        console.log(`  ! ${clErr}`);
      } else if (clOk) {
        console.log(`  ✓ CHANGELOG entry found for v${nextVersion}`);
      } else {
        const existing = clVersions.length > 0 ? clVersions.join(", ") : "(none)";
        console.log(`  ✗ No CHANGELOG entry for v${nextVersion} — release will fail without this`);
        console.log(`    Existing entries: ${existing}`);
        console.log(`    Add a "${nextVersion}" key to the CHANGELOG in components/WhatsNewModal.tsx`);
      }

      console.log("\n=== Files that would be synced to /tmp ===");
      const { files, error: syncError } = listFilesToSync();
      if (syncError) {
        console.log(`  ! ${syncError}`);
      } else if (files.length === 0) {
        console.log("  (no files found — source directory may be empty)");
      } else {
        for (const f of files) {
          console.log(`  ${f}`);
        }
        console.log(`\n  Total: ${files.length} file(s)`);
      }

      if (missing.length > 0 || !clOk) {
        console.log("\n⚠️  Preview complete — fix the issues above before running a real release.");
        process.exit(1);
      } else {
        console.log("\n✅  Preview complete — everything looks good. Run without --preview to build.");
      }
      return;
    }

    // ── CHANGELOG guard ────────────────────────────────────────────────────────
    // Check before touching any files so the developer gets a clear message
    // without needing to roll back a version bump.
    {
      const { ok: clOk, versions: clVersions, error: clErr } = checkChangelogEntry(nextVersion);
      if (clErr) {
        console.warn(`\n⚠️  CHANGELOG check warning: ${clErr}`);
        console.warn("   Continuing anyway — could not read WhatsNewModal.tsx.\n");
      } else if (!clOk) {
        console.log(`\n⚠️  No What's New entry for v${nextVersion} — adding a generic one.`);
        const inserted = insertGenericChangelogEntry(nextVersion);
        if (inserted) {
          console.log(`✓  Inserted generic CHANGELOG entry for v${nextVersion} into components/WhatsNewModal.tsx`);
          console.log(`   (Edit it before/after release if you'd like a more descriptive note.)`);
        } else {
          const existing = clVersions.length > 0 ? clVersions.join(", ") : "(none)";
          console.error(`\n❌  Could not auto-insert CHANGELOG entry for v${nextVersion}`);
          console.error(`    Existing entries: ${existing}`);
          console.error(`    Add a "${nextVersion}" key to the CHANGELOG in:`);
          console.error(`    components/WhatsNewModal.tsx`);
          console.error(`    Then re-run the release.\n`);
          process.exit(1);
        }
      } else {
        console.log(`✓  CHANGELOG entry found for v${nextVersion}`);
      }
    }

    // ── Confirmation ───────────────────────────────────────────────────────────
    if (!DRY_RUN && !YES) {
      const confirmed = await askConfirm(
        `Bump ${currentVersion} (build ${currentBuild}) → ${nextVersion} (build ${nextBuild}) and start EAS build? [y/N] `,
      );
      if (!confirmed) {
        console.log("Aborted — no files were changed.");
        await notify(
          `${APP_NAME} — Release aborted ⛔`,
          `Release aborted at confirmation prompt — no build started.\n\nVersion that would have shipped: ${nextVersion} (build ${nextBuild})`,
          { priority: "default", tags: ["no_entry"] },
        );
        process.exit(0);
      }
    }

    // ── Step 1: bump version ───────────────────────────────────────────────────
    if (SKIP_BUMP) {
      console.log("\n=== Step 1: bump version (SKIPPED — --skip-bump flag set) ===");
    } else {
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
    }

    // ── Step 2: create isolated /tmp build directory ───────────────────────────
    console.log("\n=== Step 2: copy artifact to /tmp ===");
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "eas-release-"));
    console.log(`Build directory: ${tmpDir}`);

    const COPY_EXCLUDE = new Set(["node_modules", ".expo", ".git", ".replit-artifact", "server"]);
    fs.cpSync(ARTIFACT_DIR, tmpDir, {
      recursive: true,
      filter: (src) => {
        const name = path.basename(src);
        return !COPY_EXCLUDE.has(name);
      },
    });
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

    // Install dependencies locally so EAS can verify the package list is valid.
    // We pass --ignore-scripts to skip postinstall hooks (e.g. ngrok binary downloads)
    // that would fail in the Replit environment. We then DELETE the generated
    // package-lock.json so that EAS runs "npm install" (not "npm ci") on its Mac
    // worker — this lets npm re-resolve platform-specific optional dependencies for
    // macOS ARM64 rather than being locked to the Linux ones we just generated.
    console.log("Installing dependencies (this takes ~30s)…");
    execSync("npm install --ignore-scripts", {
      cwd: tmpDir,
      stdio: "inherit",
    });
    const lockPath = path.join(tmpDir, "package-lock.json");
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
      console.log("package-lock.json removed (EAS will run npm install, not npm ci).");
    }
    console.log("Dependencies installed.");

    // ── Dry-run exit ───────────────────────────────────────────────────────────
    if (DRY_RUN) {
      console.log("\n=== DRY RUN — Steps 1-3 complete. Resolved package.json: ===");
      const resolvedPkg = fs.readFileSync(path.join(tmpDir, "package.json"), "utf8");
      console.log(resolvedPkg);
      console.log("=== DRY RUN complete — EAS build/submit skipped. ===\n");
      return;
    }

    // ── Step 4: EAS build ──────────────────────────────────────────────────────
    // EAS_NO_VCS=1 tells EAS CLI to use a shallow file copy instead of a git
    // archive. This is required in the Replit environment where git commits are
    // restricted to the workspace main agent.
    console.log("\n=== Step 4: EAS build ===");
    const { status: buildStatus, combined: buildOutput } = runCapture(
      "eas",
      ["build", "--platform", "ios", "--profile", "production", "--non-interactive"],
      tmpDir,
      { EAS_NO_VCS: "1" },
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

    // ── Step 5: EAS submit ─────────────────────────────────────────────────────
    // Write the ASC API key from the ASC_API_KEY_P8 environment secret to
    // /tmp/asc_key.p8 (the path referenced in eas.json). This must happen before
    // EAS submit so the submit step can authenticate with Apple.
    console.log("\n=== Step 5: EAS submit ===");
    const ascKeyContent = process.env.ASC_API_KEY_P8;
    if (ascKeyContent) {
      fs.writeFileSync("/tmp/asc_key.p8", ascKeyContent, "utf8");
      console.log("Wrote /tmp/asc_key.p8 from ASC_API_KEY_P8 secret.");
    } else {
      console.warn("[warn] ASC_API_KEY_P8 env var not set — /tmp/asc_key.p8 may be missing.");
    }
    // Run submit from ARTIFACT_DIR (not tmpDir) so the EAS project context is
    // correct and --latest picks up the build we just triggered.
    const { status: submitStatus, combined: submitOutput } = runCapture(
      "eas",
      ["submit", "--platform", "ios", "--profile", "production", "--non-interactive", "--latest"],
      ARTIFACT_DIR,
      { EAS_NO_VCS: "1" },
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
