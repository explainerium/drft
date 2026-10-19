import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

export default function LoginPage() {
  return (
    <AuthShell>
      {/* The form reads the query string (?next=), which only exists at request time. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
