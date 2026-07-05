// One-time login to BOTH LockedOn and RP Data in a single browser context, then
// save the combined session. Run with:  npm run login
//
// If either site uses SSO/MFA/captcha, set HEADLESS=false in .env and complete
// those steps by hand in the opened window — the saved session still captures
// the result.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "./config.js";
import { loginLockedOn } from "./lockedon.js";
import { loginRpData } from "./rpdata.js";

async function main() {
  const browser = await chromium.launch({ headless: config.headless });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("Logging into LockedOn...");
  await loginLockedOn(page);
  console.log("Logging into RP Data...");
  await loginRpData(page);

  await mkdir(dirname(config.storageStatePath), { recursive: true });
  await context.storageState({ path: config.storageStatePath });
  console.log(`Combined session saved to ${config.storageStatePath}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
