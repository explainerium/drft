import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountShell } from "@/components/account/AccountShell";
import { Container } from "@/components/shared/Container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: { default: t("title"), template: "%s | DRFT" }, robots: { index: false } };
}

/** The signed-in customer's area. Everything inside renders in the browser with the session. */
export default function AccountLayout({ children }: LayoutProps<"/[locale]/account">) {
  return (
    <main className="flex-1 bg-surface py-10 lg:py-16">
      <Container>
        <AccountShell>{children}</AccountShell>
      </Container>
    </main>
  );
}
