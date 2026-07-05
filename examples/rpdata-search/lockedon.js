// LockedOn web-UI automation: find listed properties, read their
// enquiries/inspections, and write private notes — all via the browser, since
// the available LockedOn API tools are create-only.
//
// All selectors live in config.js and are PLACEHOLDERS until captured with
// `npm run codegen:lockedon`.
import { config } from "./config.js";
import { performLogin, isLoggedOut } from "./auth.js";

const lo = config.lockedOn;
const sel = lo.selectors;

export const loginLockedOn = (page) => performLogin(page, lo, "LockedOn");

// Returns [{ address, url }] for every currently-listed property.
export async function getListedProperties(page) {
  await page.goto(new URL(sel.listedPropertiesUrl, lo.baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });
  // A stale saved session lands on the login page; surface that instead of
  // silently returning zero properties.
  if (await isLoggedOut(page, lo)) {
    throw new Error("LockedOn session appears expired — run `npm run login` again.");
  }
  const rows = page.locator(sel.propertyRow);
  const count = await rows.count();
  const properties = [];
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const address =
      (await row.locator(sel.propertyAddress).textContent().catch(() => null))?.trim() ?? "";
    const href = await row.locator("a").first().getAttribute("href").catch(() => null);
    properties.push({ address, url: href ? new URL(href, lo.baseUrl).toString() : null });
  }
  return properties;
}

// For one property page, read its enquiry + inspection contacts.
// Returns [{ name, type: "enquiry"|"inspection", recordUrl }].
export async function getContacts(page, property) {
  const contacts = [];
  if (property.url) await page.goto(property.url, { waitUntil: "domcontentloaded" });

  for (const [type, tabSel] of [
    ["enquiry", sel.enquiriesTab],
    ["inspection", sel.inspectionsTab],
  ]) {
    try {
      await page.click(tabSel, { timeout: 8000 });
      const rows = page.locator(sel.contactRow);
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        const name =
          (await row.locator(sel.contactName).textContent().catch(() => null))?.trim() ?? "";
        const href = await row.locator("a").first().getAttribute("href").catch(() => null);
        if (name) {
          contacts.push({
            name,
            type,
            recordUrl: href ? new URL(href, lo.baseUrl).toString() : property.url,
          });
        }
      }
    } catch (err) {
      console.warn(`  Could not read ${type} contacts: ${err.message}`);
    }
  }
  return contacts;
}

// Append text to the private notes of an enquiry/inspection record.
// Honours config.writeNotes — when false it only logs the intended note.
export async function writePrivateNote(page, contact, noteText) {
  if (!config.writeNotes) {
    console.log(`  [dry-run] would note on ${contact.type} for ${contact.name}: ${noteText}`);
    return;
  }
  await page.goto(contact.recordUrl, { waitUntil: "domcontentloaded" });
  const field = page.locator(sel.privateNotesInput);
  const existing = (await field.inputValue().catch(() => "")) || "";
  const combined = existing ? `${existing}\n${noteText}` : noteText;
  await field.fill(combined);
  await page.click(sel.saveNotesButton);
  console.log(`  Saved private note on ${contact.type} for ${contact.name}`);
}
