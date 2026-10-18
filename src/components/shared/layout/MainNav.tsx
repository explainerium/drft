"use client";

import { useTranslations } from "next-intl";
import { MAIN_NAV } from "@/constants/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/** The links themselves. Without a pathname nothing is marked active (the prerendered fallback). */
export function MainNavLinks({ pathname }: { pathname?: string }) {
  const t = useTranslations("layout.nav");

  return (
    <nav aria-label={t("label")} className="hidden items-center gap-6 lg:flex">
      {MAIN_NAV.map(({ key, href }) => {
        const active = !!pathname && (pathname === href || pathname.startsWith(`${href}/`));
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "text-sm font-medium tracking-[-0.005em] text-muted-foreground transition-colors hover:text-foreground",
              active && "text-foreground",
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Reads the URL, so on dynamic routes it renders after the static shell:
 * keep it inside <Suspense fallback={<MainNavLinks />}>.
 */
export function MainNav() {
  return <MainNavLinks pathname={usePathname()} />;
}
