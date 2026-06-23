// Shared best-effort login flow for both sites. If SSO/MFA/captcha is in play,
// run headed (HEADLESS=false) and finish by hand — the long waitForSelector
// gives you time, and the saved session captures the result.
export async function performLogin(page, site, label) {
  const sel = site.selectors;
  await page.goto(site.baseUrl, { waitUntil: "domcontentloaded" });
  try {
    if (site.username) {
      await page.fill(sel.usernameInput, site.username, { timeout: 8000 });
      await page.fill(sel.passwordInput, site.password, { timeout: 8000 });
      await page.click(sel.loginButton, { timeout: 8000 });
    }
  } catch (err) {
    console.warn(`${label} auto-login skipped — finish manually.`, err.message);
  }
  await page.waitForSelector(sel.loggedInMarker, { timeout: 180000 });
}

// True when the site's login form is on screen — i.e. the saved session has
// expired and we are looking at a sign-in page rather than the app.
export async function isLoggedOut(page, site) {
  return (await page.locator(site.selectors.usernameInput).count()) > 0;
}
