import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { VerifyEmail } from "@/components/auth/VerifyEmail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.verify");
  return { title: t("title"), robots: { index: false } };
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      {/* The form reads the query string (token), which only exists at request time. */}
      <Suspense>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
