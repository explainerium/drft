import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CartButton } from "@/components/cart/CartButton";
import { Link } from "@/i18n/navigation";
import { AccountMenu } from "./AccountMenu";
import { HeaderSearch } from "./HeaderSearch";
import { LocaleSwitcher, LocaleSwitcherFallback } from "./LocaleSwitcher";
import { Logo } from "./Logo";
import { MainNav, MainNavLinks } from "./MainNav";
import { MobileNav } from "./MobileNav";

export async function SiteHeader() {
  const t = await getTranslations("layout");

  return (
    <header className="sticky top-0 z-40 bg-background/90 shadow-[0_1px_8px_rgb(0_0_0/0.03)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8 lg:h-19 xl:px-16">
        <div className="flex items-center gap-2">
          <MobileNav />
          <Link href="/" aria-label={t("home")} className="-my-1 py-1">
            <Logo className="h-5 lg:h-6" />
          </Link>
        </div>

        <Suspense fallback={<MainNavLinks />}>
          <MainNav />
        </Suspense>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:block">
            <Suspense fallback={<LocaleSwitcherFallback />}>
              <LocaleSwitcher />
            </Suspense>
          </div>
          <HeaderSearch />
          <CartButton />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
