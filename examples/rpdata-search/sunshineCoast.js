// Decide whether a property address is on the Sunshine Coast.
//
// RP Data addresses are typically "<street>, <SUBURB> <STATE> <POSTCODE>", e.g.
// "12 Wave St, Noosa Heads QLD 4567". We only test the locality/state/postcode
// *tail* (after the last comma) so that street numbers and street names that
// happen to look like a postcode/suburb don't cause false positives — e.g.
// "4567 Smith St, Brisbane QLD 4000" and "12 Noosa Court, Melbourne VIC 3000"
// must NOT match.
import { config } from "./config.js";

// Precompute once at module load (these come from static config).
const postcodeSet = new Set(config.sunshineCoast.postcodes.map(String));
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const suburbPatterns = config.sunshineCoast.suburbKeywords.map(
  (kw) => new RegExp(`\\b${escapeRe(kw)}\\b`, "i"),
);

export function isSunshineCoast(address) {
  if (!address) return false;
  const text = String(address).trim();

  // Isolate the part holding suburb/state/postcode (after the final comma).
  // Falls back to the whole string when there is no comma.
  const tail = text.includes(",") ? text.slice(text.lastIndexOf(",") + 1) : text;

  // Postcode: AU postcodes sit at the END of the address, so match the trailing
  // 4-digit group. The \b prevents capturing the last 4 digits of a longer
  // number (e.g. "PO Box 14550" must not match 4550) and avoids treating a
  // street/unit number earlier in the line as a postcode, including in
  // comma-less addresses where the tail is the whole string.
  const pc = tail.match(/\b(\d{4})\s*$/);
  if (pc && postcodeSet.has(pc[1])) return true;

  // Suburb: whole-word match, but only within the tail.
  return suburbPatterns.some((re) => re.test(tail));
}
