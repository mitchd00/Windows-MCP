// Prospecting pipeline:
//   LockedOn listed properties → their enquiries/inspections → search each
//   contact in RP Data → if they own a Sunshine Coast property, write a private
//   note on that enquiry/inspection.
//
//   npm run login   # once, to establish the combined session
//   npm run start    # run the pipeline (dry-run unless WRITE_NOTES=true)

import { chromium } from "playwright";
import { writeFile, access } from "node:fs/promises";
import { stringify } from "csv-stringify/sync";
import { config } from "./config.js";
import { getListedProperties, getContacts, writePrivateNote } from "./lockedon.js";
import { getOwnedProperties } from "./rpdata.js";
import { isSunshineCoast } from "./sunshineCoast.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  try {
    await access(config.storageStatePath);
  } catch {
    throw new Error(
      `No saved session at ${config.storageStatePath}. Run "npm run login" first.`,
    );
  }

  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext({ storageState: config.storageStatePath });
  const page = await context.newPage();

  const report = [];

  const listed = await getListedProperties(page);
  console.log(`Found ${listed.length} listed propert${listed.length === 1 ? "y" : "ies"}.`);

  for (const property of listed) {
    console.log(`\nProperty: ${property.address}`);
    const contacts = await getContacts(page, property);
    console.log(`  ${contacts.length} enquiry/inspection contact(s).`);

    for (const contact of contacts) {
      await sleep(config.delayBetweenActionsMs);
      console.log(`  Searching RP Data: ${contact.name} (${contact.type})`);

      let owned = [];
      try {
        owned = await getOwnedProperties(page, contact.name);
      } catch (err) {
        console.warn(`    RP Data search failed: ${err.message}`);
      }

      const scOwned = owned.filter(isSunshineCoast);
      const row = {
        listedProperty: property.address,
        contact: contact.name,
        recordType: contact.type,
        ownedCount: owned.length,
        sunshineCoastProperties: scOwned.join(" | "),
        flagged: scOwned.length > 0 ? "YES" : "",
      };
      report.push(row);

      if (scOwned.length) {
        const note =
          `[Auto] Owns Sunshine Coast property: ${scOwned.join("; ")}. ` +
          `Potential seller — flagged ${new Date().toISOString().slice(0, 10)}.`;
        await writePrivateNote(page, contact, note);
      }
    }
  }

  await browser.close();

  await writeFile(config.reportCsv, stringify(report, { header: true }), "utf8");
  const flagged = report.filter((r) => r.flagged).length;
  console.log(
    `\nDone. ${report.length} contact(s) checked, ${flagged} flagged. ` +
      `Report: ${config.reportCsv}` +
      (config.writeNotes ? "" : "  (dry-run: set WRITE_NOTES=true to save notes)"),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
