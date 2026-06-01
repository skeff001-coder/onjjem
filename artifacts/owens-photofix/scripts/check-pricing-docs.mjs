/**
 * check-pricing-docs.mjs
 *
 * Reads the canonical prices from lib/pricing.ts and verifies that the values
 * listed in PRICING_AUDIT.md match — both in the subscription table and in the
 * Apple submission checklist.
 *
 * Run: node scripts/check-pricing-docs.mjs
 * Exit 0 = in sync. Exit 1 = drift detected (prints what is missing).
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const pricingTs = readFileSync(resolve(root, "lib", "pricing.ts"), "utf8");
const auditMd = readFileSync(resolve(root, "PRICING_AUDIT.md"), "utf8");

// ---------------------------------------------------------------------------
// 1. Extract canonical values from lib/pricing.ts
// ---------------------------------------------------------------------------

/**
 * Narrow to the text block for a top-level PRICING sub-object (e.g. "perPhoto")
 * then extract the string literal value for a leaf key within it.
 */
function extractFromSection(sectionKey, leafKey) {
  const sectionStart = pricingTs.indexOf(`${sectionKey}:`);
  if (sectionStart === -1) {
    throw new Error(`Section "${sectionKey}" not found in lib/pricing.ts`);
  }

  const openBrace = pricingTs.indexOf("{", sectionStart);
  let depth = 0;
  let sectionEnd = openBrace;
  for (let i = openBrace; i < pricingTs.length; i++) {
    if (pricingTs[i] === "{") depth++;
    else if (pricingTs[i] === "}") {
      depth--;
      if (depth === 0) { sectionEnd = i; break; }
    }
  }

  const sectionText = pricingTs.slice(openBrace, sectionEnd + 1);
  const match = sectionText.match(new RegExp(`${leafKey}\\s*:\\s*"([^"]+)"`));
  if (!match) {
    throw new Error(
      `Key "${leafKey}" not found in section "${sectionKey}" of lib/pricing.ts`
    );
  }
  return match[1];
}

const perPhotoAmount   = extractFromSection("perPhoto", "amount");   // e.g. "£1.49"
const perPhotoPlanName = extractFromSection("perPhoto", "planName"); // e.g. "One Photo Enhancement"
const monthlyAmount    = extractFromSection("monthly",  "amount");   // e.g. "£12.99"
const monthlyPlanName  = extractFromSection("monthly",  "planName"); // e.g. "Monthly Access"

console.log(`Canonical prices from lib/pricing.ts:`);
console.log(`  perPhoto : ${perPhotoPlanName} — ${perPhotoAmount}`);
console.log(`  monthly  : ${monthlyPlanName} — ${monthlyAmount}`);
console.log();

// ---------------------------------------------------------------------------
// 2. Narrow the PRICING_AUDIT.md to named sections for targeted checks
// ---------------------------------------------------------------------------

/**
 * Return the text between two markdown section headings (## …).
 * `startHeading` is the heading text to find (without "## ").
 * Returns all text up to the next heading of the same or higher level.
 */
function extractSection(heading) {
  const marker = `## ${heading}`;
  const start = auditMd.indexOf(marker);
  if (start === -1) {
    throw new Error(`Section "## ${heading}" not found in PRICING_AUDIT.md`);
  }
  // Find the next ##-level heading after this one
  const nextHeading = auditMd.indexOf("\n## ", start + marker.length);
  return nextHeading === -1
    ? auditMd.slice(start)
    : auditMd.slice(start, nextHeading);
}

const pricingSection   = extractSection("Subscription / IAP pricing (matches declared App Store IAPs)");
const checklistSection = extractSection("Apple submission checklist");

// ---------------------------------------------------------------------------
// 3. Assertions
// ---------------------------------------------------------------------------

const failures = [];

function check(label, condition, detail) {
  if (!condition) {
    failures.push(`FAIL  ${label}\n      ${detail}`);
    console.error(`FAIL  ${label}`);
    console.error(`      ${detail}`);
  } else {
    console.log(`OK    ${label}`);
  }
}

// -- Pricing table: each plan name and its amount must appear on the SAME row --

const tableRows = pricingSection
  .split("\n")
  .filter((l) => l.startsWith("|") && !l.startsWith("| -") && !l.startsWith("| Plan"));

const perPhotoRow = tableRows.find(
  (r) => r.includes(perPhotoPlanName) && r.includes(perPhotoAmount)
);
check(
  `Pricing table row: "${perPhotoPlanName}" with "${perPhotoAmount}"`,
  !!perPhotoRow,
  `No table row in "## Subscription / IAP pricing" contains both "${perPhotoPlanName}" and "${perPhotoAmount}".`
);

const monthlyRow = tableRows.find(
  (r) => r.includes(monthlyPlanName) && r.includes(monthlyAmount)
);
check(
  `Pricing table row: "${monthlyPlanName}" with "${monthlyAmount}"`,
  !!monthlyRow,
  `No table row in "## Subscription / IAP pricing" contains both "${monthlyPlanName}" and "${monthlyAmount}".`
);

// -- Checklist: must reference both amounts together (e.g. "£1.49 / £12.99") --

const checklistHasPerPhoto = checklistSection.includes(perPhotoAmount);
const checklistHasMonthly  = checklistSection.includes(monthlyAmount);

check(
  `Apple checklist contains per-photo amount "${perPhotoAmount}"`,
  checklistHasPerPhoto,
  `"${perPhotoAmount}" not found in "## Apple submission checklist" section.`
);

check(
  `Apple checklist contains monthly amount "${monthlyAmount}"`,
  checklistHasMonthly,
  `"${monthlyAmount}" not found in "## Apple submission checklist" section.`
);

// ---------------------------------------------------------------------------
// 4. Result
// ---------------------------------------------------------------------------

console.log();
if (failures.length > 0) {
  console.error(
    `${failures.length} check(s) failed — update PRICING_AUDIT.md to match lib/pricing.ts.`
  );
  process.exit(1);
} else {
  console.log("All pricing checks passed — PRICING_AUDIT.md is in sync with lib/pricing.ts.");
}
