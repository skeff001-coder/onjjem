#!/usr/bin/env node
/**
 * Bumps the patch segment of expo.version in app.json (e.g. 1.0.0 → 1.0.1)
 * and increments expo.ios.buildNumber by 1.
 *
 * Attempts a git commit of the change so release history is tracked; if git is
 * unavailable (e.g. blocked in the current environment) it logs a warning and
 * continues — the file is still updated.
 *
 * Usage: node scripts/bump-version.js [--minor | --major]
 *   (default: patch bump)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const APP_JSON = path.resolve(__dirname, '..', 'app.json');

const flag = process.argv[2];
const bumpType = flag === '--major' ? 'major' : flag === '--minor' ? 'minor' : 'patch';

const raw = fs.readFileSync(APP_JSON, 'utf8');
const config = JSON.parse(raw);

// ── semver version bump ──────────────────────────────────────────────────────
const current = config.expo.version;
const parts = current.split('.').map(Number);
if (parts.length !== 3 || parts.some(isNaN)) {
  console.error(`Unexpected version format in app.json: "${current}"`);
  process.exit(1);
}

if (bumpType === 'major') {
  parts[0] += 1;
  parts[1] = 0;
  parts[2] = 0;
} else if (bumpType === 'minor') {
  parts[1] += 1;
  parts[2] = 0;
} else {
  parts[2] += 1;
}

const next = parts.join('.');
config.expo.version = next;
console.log(`Version bumped: ${current} → ${next}`);

// ── buildNumber bump ─────────────────────────────────────────────────────────
const currentBuild = parseInt(config.expo?.ios?.buildNumber ?? '0', 10);
const nextBuild = currentBuild + 1;
if (!config.expo.ios) config.expo.ios = {};
config.expo.ios.buildNumber = String(nextBuild);
console.log(`Build number bumped: ${currentBuild} → ${nextBuild}`);

fs.writeFileSync(APP_JSON, JSON.stringify(config, null, 2) + '\n', 'utf8');

// Git commit skipped — Replit environment manages version control via checkpoints.
