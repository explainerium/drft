import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/dashboard/AdminLoginForm";
import { Logo } from "@/components/shared/layout/Logo";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("login") };
}

// The proxy sends signed-out visitors of /admin/* here with ?next=.
export default async function AdminLoginPage() {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.login" });
  return (
    <main className="flex flex-1 items-center justify-center bg-surface px-4 py-16">
      <div className="flex w-full max-w-sm flex-col gap-8 rounded-md bg-card p-6 shadow-xs sm:p-8">
        <div className="flex flex-col gap-4">
          <Logo id="admin-login-logo" />
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        {/* useSearchParams (?next=) is only known at request time. */}
        <Suspense>
          <AdminLoginForm />
        </Suspense>
      </div>
    </main>
  );
}
