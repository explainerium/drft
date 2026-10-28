"use client";

import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ACCOUNT_LINKS, MAIN_NAV } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher, LocaleSwitcherFallback } from "./LocaleSwitcher";
import { Logo } from "./Logo";

/** Below `lg` the main nav and the Account link move into this drawer. */
export function MobileNav() {
  const t = useTranslations("layout");
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("mobileNav.open")} className="-ml-2 lg:hidden">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 gap-0">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>
            <Logo className="h-5" />
          </SheetTitle>
          <SheetDescription className="sr-only">{t("mobileNav.description")}</SheetDescription>
        </SheetHeader>

        <nav aria-label={t("nav.label")} className="flex flex-col px-6 py-4">
          {MAIN_NAV.map(({ key, href }) => (
            <Link key={key} href={href} onClick={close} className="py-3 font-heading text-lg font-medium">
              {t(`nav.${key}`)}
            </Link>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-1 border-t border-border px-6 py-5 text-sm text-muted-foreground">
          <Link href={ACCOUNT_LINKS.account} onClick={close} className="py-2 hover:text-foreground">
            {t("account.myAccount")}
          </Link>
          <Link href={ACCOUNT_LINKS.login} onClick={close} className="py-2 hover:text-foreground">
            {t("account.signIn")}
          </Link>
          <div className="pt-3">
            <Suspense fallback={<LocaleSwitcherFallback />}>
              <LocaleSwitcher />
            </Suspense>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
