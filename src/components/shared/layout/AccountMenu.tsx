"use client";

import { UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { Link, useRouter } from "@/i18n/navigation";
import { useLogoutMutation, useSession } from "@/redux/api/authApi";
import type { User } from "@/types/auth";

/** Header account menu: sign in / create account for visitors, account links and sign out once signed in. */
export function AccountMenu() {
  return useIsClient() ? <LiveAccountMenu /> : <AccountMenuView user={null} />;
}

function LiveAccountMenu() {
  const { user } = useSession();
  return <AccountMenuView user={user} />;
}

function AccountMenuView({ user }: { user: User | null }) {
  const t = useTranslations("layout.account");
  const [logout] = useLogoutMutation();
  const router = useRouter();

  const signOut = async () => {
    await logout()
      .unwrap()
      .catch(() => undefined);
    toast.success(t("signedOut"));
    // Read on click, not with usePathname: the header renders on every route, prerendered ones included.
    if (/^(\/[a-z]{2})?\/account(\/|$)/.test(window.location.pathname)) router.replace("/");
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label={t("menu")} className="size-8 rounded-xl">
          <UserRoundIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {user ? (
          <>
            <DropdownMenuLabel className="truncate">{t("greeting", { name: user.firstName })}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={ACCOUNT_LINKS.account}>{t("myAccount")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ACCOUNT_LINKS.orders}>{t("orders")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ACCOUNT_LINKS.wishlist}>{t("wishlist")}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}>{t("signOut")}</DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href={ACCOUNT_LINKS.login}>{t("signIn")}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={ACCOUNT_LINKS.register}>{t("register")}</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
