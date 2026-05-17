#!/usr/bin/env node
/**
 * Full iOS release pipeline:
 *   1. Bump the semver version in app.json
 *   2. EAS build (production, non-interactive)
 *   3. EAS submit (production, non-interactive)
 *   4. Send a push notification via ntfy.sh on success or failure
 *
 * Set the NOTIFY_TOPIC env var (Replit Secret) to your ntfy.sh topic name,
 * e.g.  NOTIFY_TOPIC=onjjem-builds
 * Then subscribe to that topic in the ntfy iPhone app to receive alerts.
 *
 * If NOTIFY_TOPIC is not set the script still runs — notifications are skipped.
 */

const { execSync, spawnSync } = require("child_process");
const https = require("https");

const APP_NAME = "ONJJEM Photo Restoration";

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: "inherit", shell: true });
  return result.status ?? 1;
}

function notify(title, message, { priority = "default", tags = [] } = {}) {
  const topic = process.env.NOTIFY_TOPIC;
  if (!topic) {
    console.log(`[notify] NOTIFY_TOPIC not set — skipping: ${title}`);
    return;
  }

  const body = JSON.stringify({
    topic,
    title,
    message,
    priority,
    tags,
  });

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
      console.log(`[notify] ntfy.sh response: ${res.statusCode}`);
    },
  );

  req.on("error", (err) => {
    console.warn(`[notify] Failed to send notification: ${err.message}`);
  });

  req.write(body);
  req.end();
}

function main() {
  console.log("\n=== Step 1: bump version ===");
  try {
    execSync("node scripts/bump-version.js", { stdio: "inherit" });
  } catch (err) {
    notify(`${APP_NAME} — Release failed`, "Version bump step failed.", {
      priority: "high",
      tags: ["rotating_light"],
    });
    process.exit(1);
  }

  console.log("\n=== Step 2: EAS build ===");
  const buildStatus = run("eas", [
    "build",
    "--platform",
    "ios",
    "--profile",
    "production",
    "--non-interactive",
  ]);

  if (buildStatus !== 0) {
    notify(`${APP_NAME} — Build failed ❌`, "EAS build step exited with an error. Check the Replit console for details.", {
      priority: "high",
      tags: ["rotating_light"],
    });
    process.exit(buildStatus);
  }

  console.log("\n=== Step 3: EAS submit ===");
  const submitStatus = run("eas", [
    "submit",
    "--platform",
    "ios",
    "--profile",
    "production",
    "--non-interactive",
  ]);

  if (submitStatus !== 0) {
    notify(`${APP_NAME} — Submit failed ❌`, "Build succeeded but the App Store submission step failed. Check the Replit console for details.", {
      priority: "high",
      tags: ["rotating_light"],
    });
    process.exit(submitStatus);
  }

  notify(`${APP_NAME} — Submitted ✅`, "Your new build has been sent to App Store Connect. It should appear in TestFlight within a few minutes.", {
    priority: "default",
    tags: ["white_check_mark", "iphone"],
  });

  console.log("\n✅  Release pipeline complete — build submitted to App Store Connect.");
}

main();
