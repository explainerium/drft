import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default function RegisterPage() {
  return (
    <AuthShell>
      {/* The form reads the query string (?next=), which only exists at request time. */}
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
