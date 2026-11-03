import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { SiteContentSync } from "@/components/siteTexts/SiteContentSync";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ADMIN_LOCALE, ADMIN_TIME_ZONE } from "@/constants/admin";
import { fontVariables } from "@/lib/fonts";
import messages from "../../../messages/en.json";
import "../globals.css";

// The admin is not localized, so it is its own root layout outside [locale].
// There is no locale root param here: translations name the locale explicitly.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return {
    title: { default: t("title"), template: `%s | ${t("title")}` },
    robots: { index: false, follow: false },
  };
}

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang={ADMIN_LOCALE} className={`${fontVariables} h-full antialiased`}>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before hydration. */}
      <body className="admin flex min-h-full flex-col bg-surface" suppressHydrationWarning>
        <NextIntlClientProvider locale={ADMIN_LOCALE} messages={messages} timeZone={ADMIN_TIME_ZONE}>
          <StoreProvider>
            <SiteContentSync />
            <TooltipProvider>{children}</TooltipProvider>
          </StoreProvider>
          <Toaster position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
