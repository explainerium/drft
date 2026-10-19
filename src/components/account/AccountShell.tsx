"use client";

import { HeartIcon, LogOutIcon, MapPinIcon, PackageIcon, UserRoundIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, type ReactNode } from "react";
import { toast } from "sonner";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useLogoutMutation, useSession } from "@/redux/api/authApi";

const NAV = [
  { key: "overview", href: ACCOUNT_LINKS.account, Icon: UserRoundIcon },
  { key: "orders", href: ACCOUNT_LINKS.orders, Icon: PackageIcon },
  { key: "wishlist", href: ACCOUNT_LINKS.wishlist, Icon: HeartIcon },
  { key: "addresses", href: ACCOUNT_LINKS.addresses, Icon: MapPinIcon },
] as const;

const skeleton = <div aria-hidden className="h-[420px] animate-pulse rounded-md bg-card" />;

/** The account area frame: section nav beside the page. */
export function AccountShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      {/* The active link needs the pathname, which dynamic routes only know at request time. */}
      <Suspense fallback={<AccountNavView />}>
        <AccountNav />
      </Suspense>
      <div className="flex min-w-0 flex-col gap-6">{children}</div>
    </div>
  );
}

/**
 * Wraps each account page: renders it in the browser once the session is
 * known. The proxy already sends visitors without a session cookie to sign
 * in; this covers a session that ended since (the API answers 401).
 */
export function SignedIn({ children }: { children: ReactNode }) {
  return useIsClient() ? <SessionGate>{children}</SessionGate> : skeleton;
}

function SessionGate({ children }: { children: ReactNode }) {
  const t = useTranslations("account.signInRequired");
  const { user, isLoading } = useSession();
  const pathname = usePathname();

  if (isLoading) return skeleton;
  if (!user) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-md bg-card p-6 shadow-xs sm:p-8">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
        <Link
          href={`${ACCOUNT_LINKS.login}?next=${encodeURIComponent(pathname)}`}
          className="mt-2 inline-flex h-12 items-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/85"
        >
          {t("cta")}
        </Link>
      </div>
    );
  }
  return children;
}

function AccountNav() {
  return <AccountNavView pathname={usePathname()} />;
}

/** Without a pathname nothing is marked active (the prerendered fallback). */
function AccountNavView({ pathname }: { pathname?: string }) {
  const t = useTranslations("account.nav");
  const router = useRouter();
  const [logout, state] = useLogoutMutation();
  const tSignedOut = useTranslations("layout.account");

  const isActive = (href: string) =>
    !!pathname &&
    (href === ACCOUNT_LINKS.account ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const signOut = async () => {
    await logout()
      .unwrap()
      .catch(() => undefined);
    toast.success(tSignedOut("signedOut"));
    router.replace("/");
  };

  return (
    <nav aria-label={t("label")} className="rounded-md bg-card p-2 shadow-xs">
      <ul className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
        {NAV.map(({ key, href, Icon }) => (
          <li key={key}>
            <Link
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive(href)
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-surface hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {t(key)}
            </Link>
          </li>
        ))}
        <li className="lg:mt-2 lg:border-t lg:border-border lg:pt-2">
          <button
            type="button"
            onClick={signOut}
            disabled={state.isLoading}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <LogOutIcon className="size-4" aria-hidden />
            {t("signOut")}
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** A white account card with a heading. */
export function AccountCard({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  id: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 rounded-md bg-card p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={id} className="font-heading text-xl leading-7 font-medium tracking-[-0.01em]">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
