import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import heroImage from "@/assets/images/home/hero-north-atlantic.jpg";
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
    <main className="grid min-h-svh flex-1 grid-cols-[minmax(0,1fr)] bg-background lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div className="relative hidden overflow-hidden bg-abyss lg:block">
        <Image
          src={heroImage}
          alt=""
          fill
          priority
          sizes="55vw"
          placeholder="blur"
          className="object-cover opacity-70 mix-blend-luminosity"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/40 to-abyss/10" />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-12 text-white">
          <p className="max-w-md font-heading text-3xl leading-tight font-semibold tracking-[-0.025em]">
            {t("tagline")}
          </p>
          <p className="max-w-sm text-sm text-[#b6cad5]">{t("taglineHint")}</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-16 sm:px-10">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <Logo className="h-6 self-start" />
          <div className="flex flex-col gap-1.5">
            <h1 className="font-heading text-[28px] leading-tight font-semibold tracking-[-0.025em]">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          {/* useSearchParams (?next=) is only known at request time. */}
          <Suspense>
            <AdminLoginForm />
          </Suspense>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
            {t("backToStore")}
          </Link>
        </div>
      </div>
    </main>
  );
}
