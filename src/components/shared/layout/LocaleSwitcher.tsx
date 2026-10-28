"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const linkClass = (active: boolean) =>
  cn(
    "rounded-md px-1.5 py-0.5 text-xs font-semibold tracking-[0.05em] transition-colors",
    active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
  );

function Switcher({ href }: { href: string }) {
  const t = useTranslations("layout.locale");
  const current = useLocale();
  return (
    <nav aria-label={t("label")} className="flex items-center gap-0.5">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={href}
          locale={locale}
          hrefLang={locale}
          aria-current={locale === current ? "true" : undefined}
          className={linkClass(locale === current)}
        >
          <span aria-hidden>{locale.toUpperCase()}</span>
          <span className="sr-only">{t(locale)}</span>
        </Link>
      ))}
    </nav>
  );
}

/** DE | EN, keeping the page and its query. Reads the URL: render inside <Suspense fallback={<LocaleSwitcherFallback />}>. */
export function LocaleSwitcher() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return <Switcher href={search ? `${pathname}?${search}` : pathname} />;
}

/** The prerendered stand-in: each language's home page. */
export function LocaleSwitcherFallback() {
  return <Switcher href="/" />;
}
