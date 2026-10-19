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
