// Main run: read names from a spreadsheet, search each on RP Data, scrape the
// detail fields, write them to an output spreadsheet, and (optionally) push each
// record to LockedOn via a Zapier webhook.
//
//   npm run login    # once, to establish the session
//   npm run search   # the pipeline

import { chromium } from "playwright";
import { readFile, writeFile, access } from "node:fs/promises";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import { config } from "./config.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readInput() {
  const raw = await readFile(config.io.inputCsv, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });
  if (!rows.length) throw new Error(`No rows found in ${config.io.inputCsv}`);
  if (!("name" in rows[0])) throw new Error('Input CSV must have a "name" column');
  return rows;
}

// Search one name and scrape configured detail fields. Returns a flat object.
async function searchOne(page, name) {
  const { selectors, baseUrl } = config.rpData;
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

  await page.fill(selectors.searchInput, name);
  await page.click(selectors.searchSubmit);
  await page.waitForSelector(selectors.firstResult, { timeout: 15000 });
  await page.click(selectors.firstResult);

  const result = { searchedName: name };
  for (const [field, sel] of Object.entries(selectors.detailFields)) {
    try {
      result[field] = (await page.textContent(sel, { timeout: 8000 }))?.trim() ?? "";
    } catch {
      result[field] = ""; // field absent for this record
    }
  }
  return result;
}

// Route A: hand a scraped record to LockedOn through a Zapier Catch Hook that is
// wired to the "Create Inspection" / "Create Enquiry" action.
async function pushToLockedOn(record) {
  if (!config.lockedOn.enabled) return;
  const payload = {
    record_type: config.lockedOn.recordType,
    name: record.ownerName || record.searchedName,
    property_address: record.propertyAddress || "",
    mobile_phone: record.contactPhone || "",
    comments:
      `RP Data lookup for "${record.searchedName}". ` +
      Object.entries(record)
        .map(([k, v]) => `${k}: ${v}`)
        .join("; "),
  };
  const res = await fetch(config.lockedOn.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.warn(`LockedOn webhook failed for "${record.searchedName}": ${res.status}`);
  }
}

async function main() {
  try {
    await access(config.rpData.storageStatePath);
  } catch {
    throw new Error(
      `No saved session at ${config.rpData.storageStatePath}. Run "npm run login" first.`,
    );
  }

  const rows = await readInput();
  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({ storageState: config.rpData.storageStatePath });
  const page = await context.newPage();

  const results = [];
  for (const [i, row] of rows.entries()) {
    const name = row.name;
    console.log(`[${i + 1}/${rows.length}] Searching: ${name}`);
    try {
      const record = await searchOne(page, name);
      results.push(record);
      await pushToLockedOn(record);
    } catch (err) {
      console.warn(`  Failed for "${name}": ${err.message}`);
      results.push({ searchedName: name, error: err.message });
    }
    await sleep(config.delayBetweenSearchesMs);
  }

  await browser.close();

  const csv = stringify(results, { header: true });
  await writeFile(config.io.outputCsv, csv, "utf8");
  console.log(`\nDone. ${results.length} rows written to ${config.io.outputCsv}`);
  if (config.lockedOn.enabled) console.log("Records also pushed to LockedOn.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
