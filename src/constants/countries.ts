/**
 * Checkout preselects the store's home country. The list of countries itself
 * comes from the backend (where shipping is set up); names come from Intl.
 */
export const DEFAULT_COUNTRY = "NL";

/** Calling codes for the phone field prefix. Countries missing here show no prefix. */
export const DIAL_CODES: Record<string, string> = {
  AT: "+43",
  BE: "+32",
  BG: "+359",
  CY: "+357",
  CZ: "+420",
  DE: "+49",
  DK: "+45",
  EE: "+372",
  ES: "+34",
  FI: "+358",
  FR: "+33",
  GR: "+30",
  HR: "+385",
  HU: "+36",
  IE: "+353",
  IT: "+39",
  LT: "+370",
  LU: "+352",
  LV: "+371",
  MT: "+356",
  NL: "+31",
  PL: "+48",
  PT: "+351",
  RO: "+40",
  SE: "+46",
  SI: "+386",
  SK: "+421",
};

/** "NL" → 🇳🇱 (regional indicator letters). */
export const flagEmoji = (code: string): string =>
  String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/** The 27 EU member states, for "add all EU countries" in the shipping setup. */
export const EU_COUNTRIES = [
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU",
  "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK",
];

// Region codes Intl names that are not countries one ships to.
const NOT_COUNTRIES = new Set([
  ...["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"],
  // Reserved codes and uninhabited territories.
  ...["AC", "CP", "CQ", "DG", "EA", "IC", "TA", "AQ", "BV", "HM", "TF", "UM"],
]);

let cachedCodes: string[] | null = null;

/** Every ISO 3166-1 alpha-2 country, sorted by English name (built once from Intl). */
export function allCountries(locale = "en"): { code: string; name: string }[] {
  const names = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
  if (!cachedCodes) {
    const codes: string[] = [];
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a, b);
        if (!NOT_COUNTRIES.has(code) && names.of(code)) codes.push(code);
      }
    }
    cachedCodes = codes;
  }
  return cachedCodes
    .map((code) => ({ code, name: names.of(code) ?? code }))
    .sort((x, y) => x.name.localeCompare(y.name, locale));
}
