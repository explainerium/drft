
/**
 * Home page content wiring. Labels are message keys under `home.*`.
 * Category links use the backend category slugs (`/shop/<slug>`).
 */

/** The product in the "Flagship innovation" spotlight; its copy in `home.spotlight` is written for it. */
export const SPOTLIGHT_PRODUCT_SLUG = "aero-v3-freeride-kite";

export const FLEET_SIZE = 3;

export const DISCIPLINES = [
  { key: "kites", category: "kites" },
  { key: "foils", category: "foils-wings" },
  { key: "control", category: "twintips" },
] as const;

