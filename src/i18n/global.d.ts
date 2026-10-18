import type messages from "../../messages/en.json";
import type { routing } from "./routing";

// Typed locales and message keys for useTranslations / getTranslations.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
