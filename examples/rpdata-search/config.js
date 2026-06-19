// Central configuration for the RP Data → LockedOn automation.
//
// IMPORTANT: The RP Data selectors below are PLACEHOLDERS. RP Data (CoreLogic
// RPP) is behind a login, so the exact DOM could not be inspected when this
// scaffold was generated. Capture the real selectors once with:
//
//     npm run codegen
//
// then paste them in where marked TODO. Everything else works as-is.

import "dotenv/config";

export const config = {
  // ---- RP Data (CoreLogic) ----
  rpData: {
    // Login + search start page. Adjust if your RP Data entry point differs.
    baseUrl: process.env.RPDATA_BASE_URL || "https://rpp.corelogic.com.au/",

    // Credentials are read from the environment (.env), never hardcoded.
    username: process.env.RPDATA_USERNAME,
    password: process.env.RPDATA_PASSWORD,

    // Where Playwright stores the logged-in session after `npm run login`,
    // so the search run does not need to log in every time.
    storageStatePath: "./.auth/rpdata.json",

    // TODO: capture these with `npm run codegen`.
    selectors: {
      usernameInput: 'input[name="username"]',      // TODO verify
      passwordInput: 'input[name="password"]',      // TODO verify
      loginButton: 'button[type="submit"]',         // TODO verify
      // A selector that only exists once you are logged in (used to confirm login):
      loggedInMarker: 'text=Search',                // TODO verify

      // Search box + how a result row is shown:
      searchInput: 'input[type="search"]',          // TODO verify
      searchSubmit: 'button[aria-label="Search"]',  // TODO verify
      firstResult: '.search-result:first-child',    // TODO verify

      // Detail fields to scrape from a result. Add/rename to match RP Data.
      // Keys become spreadsheet columns.
      detailFields: {
        ownerName: '[data-field="owner-name"]',     // TODO verify
        propertyAddress: '[data-field="address"]',  // TODO verify
        contactPhone: '[data-field="phone"]',       // TODO verify
        lastSalePrice: '[data-field="last-sale"]',  // TODO verify
      },
    },
  },

  // ---- Input / output spreadsheets ----
  io: {
    // Each row must have at least a "name" column (the name to search).
    inputCsv: process.env.INPUT_CSV || "./input.csv",
    outputCsv: process.env.OUTPUT_CSV || "./output.csv",
  },

  // ---- LockedOn CRM (optional, Route A) ----
  // Leave webhookUrl empty to skip pushing to LockedOn (results still go to the
  // output spreadsheet). To enable: in Zapier, create a "Catch Hook" trigger
  // wired to the LockedOn "Create Inspection" or "Create Enquiry" action, then
  // paste the hook URL here / in .env.
  lockedOn: {
    enabled: Boolean(process.env.LOCKEDON_WEBHOOK_URL),
    webhookUrl: process.env.LOCKEDON_WEBHOOK_URL || "",
    // "inspection" or "enquiry" — informational; your Zap decides the action.
    recordType: process.env.LOCKEDON_RECORD_TYPE || "inspection",
  },

  // Pace requests politely; RP Data is a licensed service, not a scraping target.
  delayBetweenSearchesMs: Number(process.env.SEARCH_DELAY_MS || 2000),
  headless: process.env.HEADLESS !== "false",
};
