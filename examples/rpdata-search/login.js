// One-time login: opens RP Data, signs in, and saves the session so the search
// run can reuse it. Run with:  npm run login
//
// Tip: if RP Data uses SSO / MFA / a captcha, run this with HEADLESS=false and
// complete those steps by hand in the opened browser window. The saved session
// (storageState) captures the result either way.

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { config } from "./config.js";

async function main() {
  const { rpData, headless } = config;

  if (!rpData.username || !rpData.password) {
    console.warn(
      "No RPDATA_USERNAME / RPDATA_PASSWORD set. Launching headed so you can " +
        "log in manually; the session will still be saved.",
    );
  }

  const browser = await chromium.launch({ headless: headless && Boolean(rpData.username) });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(rpData.baseUrl, { waitUntil: "domcontentloaded" });

  // Best-effort auto-fill; harmless if the fields aren't found (manual fallback).
  try {
    if (rpData.username) {
      await page.fill(rpData.selectors.usernameInput, rpData.username, { timeout: 8000 });
      await page.fill(rpData.selectors.passwordInput, rpData.password, { timeout: 8000 });
      await page.click(rpData.selectors.loginButton, { timeout: 8000 });
    }
  } catch (err) {
    console.warn("Auto-login step skipped/failed — finish logging in manually.", err.message);
  }

  // Wait until we can see a logged-in marker. Generous timeout for manual MFA.
  console.log("Waiting for login to complete (up to 3 minutes)...");
  await page.waitForSelector(rpData.selectors.loggedInMarker, { timeout: 180000 });

  await mkdir(dirname(rpData.storageStatePath), { recursive: true });
  await context.storageState({ path: rpData.storageStatePath });
  console.log(`Session saved to ${rpData.storageStatePath}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
