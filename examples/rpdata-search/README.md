# RP Data → LockedOn automation

Reads a list of names from a spreadsheet, searches each one on **RP Data**
(CoreLogic RPP), scrapes the detail fields, writes them to an output
spreadsheet, and **optionally** creates an **Inspection** or **Enquiry** in
**LockedOn** CRM for each result.

```
input.csv (names) ──▶ Playwright searches RP Data ──▶ output.csv
                                                  └──▶ LockedOn (optional)
```

## Why it runs locally (not in the cloud)

RP Data is behind your CoreLogic login and tied to your subscription/licence,
so the browser step must run **on your machine**, where you can sign in. This
folder is a self-contained Node + Playwright project for exactly that. Your
credentials stay in a local `.env` and are never committed.

## Setup

```bash
cd examples/rpdata-search
npm install
npx playwright install chromium
cp .env.example .env        # then fill in RPDATA_USERNAME / RPDATA_PASSWORD
cp input.example.csv input.csv
```

## 1. Capture the real RP Data selectors (one-time)

The selectors in `config.js` are **placeholders** — RP Data's login wall meant
the real DOM couldn't be inspected up front. Capture them once:

```bash
npm run codegen
```

Click through login → search → a result. Playwright prints the selectors it
generates; paste them into the matching `TODO` fields in `config.js`.

## 2. Log in once

```bash
npm run login
```

Saves your session to `.auth/rpdata.json`. If RP Data uses MFA/SSO/captcha, set
`HEADLESS=false` in `.env` and complete it by hand in the opened window — the
saved session still works for later runs.

## 3. Run the pipeline

```bash
npm run search
```

Searches every `name` row in `input.csv`, writes `output.csv`.

## LockedOn integration (optional)

Two ways to get results into LockedOn:

**Route A — automated (this script).** In Zapier, create a **Catch Hook**
trigger → **LockedOn: Create Inspection** (or **Create Enquiry**) action. Map
the JSON fields this script sends (`name`, `property_address`, `mobile_phone`,
`comments`, `record_type`). Put the hook URL in `LOCKEDON_WEBHOOK_URL`. Done —
every searched record is pushed automatically.

**Route B — assisted.** Leave the webhook empty, run the search, and the
results land in `output.csv`. Hand that file over and the Inspection/Enquiry
records can be created interactively via the LockedOn tools (one call per row,
with a chance to review each before it's created).

The LockedOn "Create Inspection" / "Create Enquiry" actions accept: `name`,
`email`, `mobile_phone`, `home_phone`, `address`, `property_address`,
`comments`, `referral_source`, and more — extend the payload in
`search.js → pushToLockedOn()` to map additional scraped fields.

## Notes

- Be respectful of RP Data's terms — this paces requests (`SEARCH_DELAY_MS`)
  and is for your own licensed, lawful lookups only.
- `.env`, `.auth/`, `input.csv`, and `output.csv` are gitignored so no
  credentials or personal data are committed.
