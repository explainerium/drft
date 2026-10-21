import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Toaster } from "sonner";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { AnnouncementBar } from "@/components/shared/layout/AnnouncementBar";
import { SiteFooter } from "@/components/shared/layout/SiteFooter";
import { SiteHeader } from "@/components/shared/layout/SiteHeader";
import { routing } from "@/i18n/routing";
import { getPublicSettings } from "@/lib/content";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

// Required by Cache Components: every root param needs at least one static value.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3005";

/** Site-wide defaults from the admin SEO settings, with the message copy as a fallback. */
export async function generateMetadata(): Promise<Metadata> {
  const [t, settings] = await Promise.all([getTranslations("metadata"), getPublicSettings().catch(() => null)]);
  const seo = settings?.seo;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: seo?.defaultTitle || t("title"), template: seo?.titleTemplate || "%s | DRFT" },
    description: seo?.defaultDescription || t("description"),
    openGraph: {
      type: "website",
      siteName: settings?.store.name || "DRFT",
      ...(seo?.ogImageUrl ? { images: [{ url: seo.ogImageUrl }] } : {}),
    },
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={`${fontVariables} h-full antialiased`}>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before hydration. */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <NextIntlClientProvider>
          <StoreProvider>
            <AnnouncementBar />
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
            <SiteFooter />
            <CartDrawer />
          </StoreProvider>
          <Toaster position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
