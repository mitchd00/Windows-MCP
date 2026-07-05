# LockedOn ⇄ RP Data prospector

Finds people in your **LockedOn** pipeline who are **potential sellers**: for
each **listed** property, it reads the enquiry/inspection contacts, looks each
one up in **RP Data**, and if they currently own a **Sunshine Coast** property,
writes a private note on that enquiry/inspection.

```
LockedOn: listed properties
   └─ each property's Enquiries + Inspections (contact names)
        └─ search name in RP Data → properties they own
             └─ if Sunshine Coast → private note on that enquiry/inspection
```

## Why it's all browser automation

The available LockedOn API actions are **create-only** — they can't read your
listed properties/enquiries or update private notes. So this drives the
**LockedOn web UI** with Playwright (read + write notes) alongside the **RP Data
web UI** (owner lookup). Both run locally where you're logged in; credentials
stay in a local `.env`.

## Setup

```bash
cd examples/rpdata-search
npm install
npx playwright install chromium
cp .env.example .env        # fill in LockedOn + RP Data logins
```

## 1. Capture the real selectors (one-time)

Every selector in `config.js` is a **placeholder** — both sites are behind
logins, so the real DOM couldn't be inspected up front. Capture them once:

```bash
npm run codegen:lockedon    # login → listed properties → a property's enquiries/inspections → private notes box
npm run codegen:rpdata      # login → name search → a person → their owned properties
```

Paste each generated selector into the matching `TODO` slot in `config.js`.

## 2. Log in once

```bash
npm run login
```

Logs into **both** sites in one browser and saves the combined session to
`.auth/session.json`. For MFA/SSO, set `HEADLESS=false` and finish by hand.

## 3. Run — dry-run first

```bash
npm run start
```

With `WRITE_NOTES=false` (default) it does the full pipeline and writes
`report.csv`, but only **logs** the notes it *would* save — nothing is written
to LockedOn. Review `report.csv`, then set `WRITE_NOTES=true` to actually save
the private notes.

## Tuning "Sunshine Coast"

`config.js → sunshineCoast` lists the postcodes (4550–4575) and suburb keywords
that count as a match. Add/trim to fit your patch. See **[SUBURBS.md](SUBURBS.md)**
for the full documented list (postcode → localities) and how the match is decided.

## Files

| File | Role |
|---|---|
| `config.js` | All settings + selectors (the `TODO`s) + Sunshine Coast rules |
| `login.js` | One-time combined login, saves the session |
| `lockedon.js` | Listed properties, contacts, private-note writing |
| `rpdata.js` | Name search → owned properties |
| `sunshineCoast.js` | Address → is-Sunshine-Coast test |
| `run.js` | Orchestrates the pipeline, writes `report.csv` |

## Safety notes

- **Dry-run by default.** Nothing is written to LockedOn until `WRITE_NOTES=true`.
- Use only for your own licensed RP Data access and your own LockedOn office.
- `.env`, `.auth/`, and `report.csv` are gitignored — no credentials or client
  data are committed.
