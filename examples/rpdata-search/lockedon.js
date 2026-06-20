// LockedOn web-UI automation: find listed properties, read their
// enquiries/inspections, and write private notes — all via the browser, since
// the available LockedOn API tools are create-only.
//
// All selectors live in config.js and are PLACEHOLDERS until captured with
// `npm run codegen:lockedon`.
import { config } from "./config.js";

const lo = config.lockedOn;
const sel = lo.selectors;

// Best-effort login. If SSO/MFA is in play, run headed and finish by hand.
export async function loginLockedOn(page) {
  await page.goto(lo.baseUrl, { waitUntil: "domcontentloaded" });
  try {
    if (lo.username) {
      await page.fill(sel.usernameInput, lo.username, { timeout: 8000 });
      await page.fill(sel.passwordInput, lo.password, { timeout: 8000 });
      await page.click(sel.loginButton, { timeout: 8000 });
    }
  } catch (err) {
    console.warn("LockedOn auto-login skipped — finish manually.", err.message);
  }
  await page.waitForSelector(sel.loggedInMarker, { timeout: 180000 });
}

// Returns [{ address, url }] for every currently-listed property.
export async function getListedProperties(page) {
  await page.goto(new URL(sel.listedPropertiesUrl, lo.baseUrl).toString(), {
    waitUntil: "domcontentloaded",
  });
  const rows = page.locator(sel.propertyRow);
  const count = await rows.count();
  const properties = [];
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    const address = (await row.locator(sel.propertyAddress).textContent())?.trim() ?? "";
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
        const name = (await row.locator(sel.contactName).textContent())?.trim() ?? "";
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
