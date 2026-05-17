#!/usr/bin/env node
/**
 * Bumps the patch segment of expo.version in app.json (e.g. 1.0.0 → 1.0.1)
 * and commits the change so release history is tracked in the repo.
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

fs.writeFileSync(APP_JSON, JSON.stringify(config, null, 2) + '\n', 'utf8');
console.log(`Version bumped: ${current} → ${next}`);

try {
  execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
} catch {
  console.error('bump-version: not inside a git repository — cannot commit version bump');
  process.exit(1);
}

execSync(`git add "${APP_JSON}"`, { stdio: 'inherit' });
execSync(`git commit -m "chore: bump app version to ${next}"`, { stdio: 'inherit' });
console.log(`Committed version bump to ${next}`);
