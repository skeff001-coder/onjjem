#!/usr/bin/env node
/**
 * Full iOS release pipeline:
 *   1. Bump the semver version in app.json
 *   2. EAS build (production, non-interactive) — captures build URL
 *   3. EAS submit (production, non-interactive)
 *   4. Send a push notification via ntfy.sh on success OR failure
 *
 * Set NOTIFY_TOPIC in Replit Secrets (e.g. "onjjem-builds-skeff001").
 * Install the free ntfy app on your iPhone and subscribe to that topic.
 * If NOTIFY_TOPIC is not set the release still runs — notifications are skipped.
 */

"use strict";

const { execSync, spawnSync } = require("child_process");
const https = require("https");

const APP_NAME = "ONJJEM Photo Restoration";
const EAS_URL_RE = /https:\/\/expo\.dev\/accounts\/[^\s]+/;

/** Returns a Promise that resolves once the ntfy request completes (or errors). */
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
        res.resume(); // drain so the socket closes
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

/** Run a command, stream output to the console, and return { status, combinedOutput }. */
function runCapture(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
    encoding: "utf8",
  });

  const out = result.stdout ?? "";
  const err = result.stderr ?? "";
  const combined = (out + "\n" + err).trim();

  // Mirror to console so the user still sees real-time-ish output
  if (out) process.stdout.write(out);
  if (err) process.stderr.write(err);

  return { status: result.status ?? 1, combined };
}

/** Extract an EAS build URL from command output, if present. */
function extractBuildUrl(text) {
  const m = text.match(EAS_URL_RE);
  return m ? m[0] : null;
}

/** Trim a raw error string to the last 400 chars for notification payloads. */
function trimError(text) {
  if (!text) return "No additional details.";
  const t = text.trim();
  return t.length <= 400 ? t : "…" + t.slice(-400);
}

async function main() {
  // ── Step 1: bump version ────────────────────────────────────────────────────
  console.log("\n=== Step 1: bump version ===");
  try {
    execSync("node scripts/bump-version.js", { stdio: "inherit" });
  } catch (err) {
    await notify(
      `${APP_NAME} — Release failed ❌`,
      `Version bump failed before build started.\n\n${trimError(String(err))}`,
      { priority: "high", tags: ["rotating_light"] },
    );
    process.exit(1);
  }

  // ── Step 2: EAS build ───────────────────────────────────────────────────────
  console.log("\n=== Step 2: EAS build ===");
  const { status: buildStatus, combined: buildOutput } = runCapture("eas", [
    "build",
    "--platform",
    "ios",
    "--profile",
    "production",
    "--non-interactive",
  ]);

  const buildUrl = extractBuildUrl(buildOutput);

  if (buildStatus !== 0) {
    await notify(
      `${APP_NAME} — Build failed ❌`,
      `EAS build exited with code ${buildStatus}.\n\n${trimError(buildOutput)}`,
      { priority: "high", tags: ["rotating_light"] },
    );
    process.exit(buildStatus);
  }

  // ── Step 3: EAS submit ──────────────────────────────────────────────────────
  console.log("\n=== Step 3: EAS submit ===");
  const { status: submitStatus, combined: submitOutput } = runCapture("eas", [
    "submit",
    "--platform",
    "ios",
    "--profile",
    "production",
    "--non-interactive",
  ]);

  if (submitStatus !== 0) {
    await notify(
      `${APP_NAME} — Submit failed ❌`,
      `Build succeeded but submission exited with code ${submitStatus}.\n\n${trimError(submitOutput)}`,
      { priority: "high", tags: ["rotating_light"] },
    );
    process.exit(submitStatus);
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  const successMsg = buildUrl
    ? `New build submitted to App Store Connect.\n\nBuild URL:\n${buildUrl}`
    : "New build submitted to App Store Connect. Check expo.dev for build details.";

  await notify(`${APP_NAME} — Submitted ✅`, successMsg, {
    priority: "default",
    tags: ["white_check_mark", "iphone"],
  });

  console.log("\n✅  Release pipeline complete — build submitted to App Store Connect.");
  if (buildUrl) console.log(`    Build URL: ${buildUrl}`);
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
