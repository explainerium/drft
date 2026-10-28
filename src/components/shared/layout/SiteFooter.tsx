import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { FOOTER_COLUMNS, LEGAL_LINKS } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";
import { getPublicSettings } from "@/lib/content";
import { LocaleSwitcher, LocaleSwitcherFallback } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

// `new Date()` is not allowed in a prerendered shell; a cached value is.
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const SOCIAL = ["instagram", "youtube", "facebook", "tiktok"] as const;

export async function SiteFooter() {
  const [t, year, settings] = await Promise.all([
    getTranslations("layout.footer"),
    currentYear(),
    // The footer must render even when the settings cannot be read.
    getPublicSettings().catch(() => null),
  ]);
  // Links set in the admin settings (social); unset ones are left out.
  const social = SOCIAL.flatMap((key) => {
    const href = settings?.social[key];
    return href ? [{ key, href }] : [];
  });

  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 md:px-8 lg:pt-20 xl:px-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_200px_200px] lg:gap-0">
          <div className="flex flex-col">
            <Link href="/" aria-label={t("home")} className="self-start">
              <Logo className="h-5" />
            </Link>
            <p className="mt-10 max-w-sm text-[15px] leading-relaxed text-muted-foreground">{t("tagline")}</p>
            <p className="mt-8 mb-3 text-sm font-medium">{t("newsletter.title")}</p>
            <NewsletterForm />
            {social.length > 0 && (
              <ul aria-label={t("social.label")} className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                {social.map(({ key, href }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {t(`social.${key}`)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-10 lg:contents">
            {FOOTER_COLUMNS.map((column) => (
              <nav key={column.key} aria-label={t(`columns.${column.key}`)}>
                <h2 className="font-sans text-sm font-semibold tracking-[0.05em] uppercase">
                  {t(`columns.${column.key}`)}
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(`links.${link.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 text-xs font-medium tracking-[0.02em] text-muted-foreground md:flex-row md:items-center md:justify-between lg:mt-24">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{t("copyright", { year })}</span>
            <Suspense fallback={<LocaleSwitcherFallback />}>
              <LocaleSwitcher />
            </Suspense>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <li key={link.key}>
                <Link href={link.href} className="transition-colors hover:text-foreground">
                  {t(`legal.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
