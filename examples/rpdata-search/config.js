// Central configuration for the LockedOn ⇄ RP Data prospecting pipeline.
//
// PIPELINE
//   LockedOn: find LISTED properties
//     → for each, read its Enquiries + Inspections (contact names)
//       → search each name in RP Data → properties they currently own
//         → if any owned property is on the Sunshine Coast,
//            write a private note on that enquiry/inspection in LockedOn.
//
// IMPORTANT: every CSS selector below is a PLACEHOLDER. Both LockedOn and RP
// Data sit behind logins, so their real DOM couldn't be inspected up front.
// Capture the real ones once with:
//     npm run codegen:lockedon
//     npm run codegen:rpdata
// and paste them into the matching TODO slots.

import "dotenv/config";

export const config = {
  // A single Playwright browser context logs into BOTH sites, so one saved
  // session file covers them both.
  storageStatePath: "./.auth/session.json",
  headless: process.env.HEADLESS !== "false",
  delayBetweenActionsMs: Number(process.env.ACTION_DELAY_MS || 1500),

  lockedOn: {
    baseUrl: process.env.LOCKEDON_BASE_URL || "https://app.lockedon.com/",
    username: process.env.LOCKEDON_USERNAME,
    password: process.env.LOCKEDON_PASSWORD,

    selectors: {
      // --- login ---
      usernameInput: 'input[name="email"]',          // TODO verify
      passwordInput: 'input[name="password"]',        // TODO verify
      loginButton: 'button[type="submit"]',           // TODO verify
      loggedInMarker: 'text=Dashboard',               // TODO verify

      // --- finding listed properties ---
      // A page/filter that lists current LISTED properties, and the rows on it.
      listedPropertiesUrl: "/properties?status=listed", // TODO verify
      propertyRow: '[data-test="property-row"]',         // TODO verify
      propertyAddress: '[data-test="property-address"]', // TODO verify

      // --- a property's enquiries & inspections ---
      enquiriesTab: 'role=tab[name="Enquiries"]',     // TODO verify
      inspectionsTab: 'role=tab[name="Inspections"]', // TODO verify
      contactRow: '[data-test="contact-row"]',        // TODO verify
      contactName: '[data-test="contact-name"]',      // TODO verify

      // --- private notes on an enquiry/inspection ---
      privateNotesInput: 'textarea[name="private_notes"]', // TODO verify
      saveNotesButton: 'button:has-text("Save")',          // TODO verify
    },
  },

  rpData: {
    baseUrl: process.env.RPDATA_BASE_URL || "https://rpp.corelogic.com.au/",
    username: process.env.RPDATA_USERNAME,
    password: process.env.RPDATA_PASSWORD,

    selectors: {
      usernameInput: 'input[name="username"]',  // TODO verify
      passwordInput: 'input[name="password"]',  // TODO verify
      loginButton: 'button[type="submit"]',     // TODO verify
      loggedInMarker: 'text=Search',            // TODO verify

      // Search a person's name, open them, list properties they own.
      searchInput: 'input[type="search"]',          // TODO verify
      searchSubmit: 'button[aria-label="Search"]',  // TODO verify
      personResult: '.search-result:first-child',   // TODO verify
      ownedPropertyRow: '[data-field="owned-property"]', // TODO verify
      ownedPropertyAddress: '[data-field="address"]',    // TODO verify
    },
  },

  // What counts as "Sunshine Coast". A property matches if its address contains
  // one of these postcodes OR one of these suburb keywords (case-insensitive).
  sunshineCoast: {
    // Sunshine Coast + Noosa LGAs, roughly postcodes 4550–4575 (plus a few).
    postcodes: [
      "4550", "4551", "4552", "4553", "4554", "4555", "4556", "4557", "4558",
      "4559", "4560", "4561", "4562", "4563", "4564", "4565", "4566", "4567",
      "4568", "4569", "4570", "4571", "4572", "4573", "4574", "4575",
    ],
    suburbKeywords: [
      "Sunshine Coast", "Caloundra", "Maroochydore", "Mooloolaba", "Noosa",
      "Buderim", "Nambour", "Coolum", "Peregian", "Maleny", "Kawana",
      "Sippy Downs", "Mountain Creek", "Twin Waters", "Marcoola",
    ],
  },

  // A run report is written here for your records.
  reportCsv: process.env.REPORT_CSV || "./report.csv",
  // Safety switch: when false, the script logs what it WOULD write to LockedOn
  // notes but does not actually save. Flip to true once selectors are verified.
  writeNotes: process.env.WRITE_NOTES === "true",
};
