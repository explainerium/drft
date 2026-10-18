"use client";

import { UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";

// Static links for now; it switches on the signed-in user once the auth pages land (M4).
export function AccountMenu() {
  const t = useTranslations("layout.account");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label={t("menu")} className="size-8 rounded-xl">
          <UserRoundIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link href={ACCOUNT_LINKS.login}>{t("signIn")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ACCOUNT_LINKS.register}>{t("register")}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ACCOUNT_LINKS.account}>{t("myAccount")}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ACCOUNT_LINKS.orders}>{t("orders")}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
