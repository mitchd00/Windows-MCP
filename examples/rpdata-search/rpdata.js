// RP Data (CoreLogic) web-UI automation: search a person's name and return the
// properties they currently own.
//
// Selectors live in config.js and are PLACEHOLDERS until captured with
// `npm run codegen:rpdata`.
import { config } from "./config.js";

const rp = config.rpData;
const sel = rp.selectors;

export async function loginRpData(page) {
  await page.goto(rp.baseUrl, { waitUntil: "domcontentloaded" });
  try {
    if (rp.username) {
      await page.fill(sel.usernameInput, rp.username, { timeout: 8000 });
      await page.fill(sel.passwordInput, rp.password, { timeout: 8000 });
      await page.click(sel.loginButton, { timeout: 8000 });
    }
  } catch (err) {
    console.warn("RP Data auto-login skipped — finish manually.", err.message);
  }
  await page.waitForSelector(sel.loggedInMarker, { timeout: 180000 });
}

// Search a name and return a list of owned-property address strings.
// Returns [] if the person isn't found.
export async function getOwnedProperties(page, name) {
  await page.goto(rp.baseUrl, { waitUntil: "domcontentloaded" });
  await page.fill(sel.searchInput, name);
  await page.click(sel.searchSubmit);

  try {
    await page.waitForSelector(sel.personResult, { timeout: 12000 });
  } catch {
    return []; // no match
  }
  await page.click(sel.personResult);

  const rows = page.locator(sel.ownedPropertyRow);
  const count = await rows.count().catch(() => 0);
  const addresses = [];
  for (let i = 0; i < count; i++) {
    const addr = (await rows.nth(i).locator(sel.ownedPropertyAddress).textContent())?.trim();
    if (addr) addresses.push(addr);
  }
  return addresses;
}
