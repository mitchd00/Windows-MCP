// Decide whether a property address is on the Sunshine Coast.
import { config } from "./config.js";

const { postcodes, suburbKeywords } = config.sunshineCoast;

export function isSunshineCoast(address) {
  if (!address) return false;
  const text = String(address);
  if (postcodes.some((pc) => new RegExp(`\\b${pc}\\b`).test(text))) return true;
  const lower = text.toLowerCase();
  return suburbKeywords.some((kw) => lower.includes(kw.toLowerCase()));
}
