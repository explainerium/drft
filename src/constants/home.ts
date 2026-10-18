import brittanyImage from "@/assets/images/home/journal-brittany.jpg";
import circularityImage from "@/assets/images/home/journal-circularity.jpg";
import tuningImage from "@/assets/images/home/journal-tuning.jpg";

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

// Static until the journal is built (M6); then the latest posts come from the API.
export const JOURNAL_POSTS = [
  { key: "brittany", href: "/journal/western-brittany-wind-window", image: brittanyImage },
  { key: "tuning", href: "/journal/hydrofoil-tuning-variable-chop", image: tuningImage },
  { key: "circularity", href: "/journal/recycling-canopy-dacron", image: circularityImage },
] as const;
