import { MailIcon, MapPinIcon, PhoneIcon, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ContactForm } from "@/components/content/ContactForm";
import { Container } from "@/components/shared/Container";
import { getPublicSettings } from "@/lib/content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content.contact");
  return { title: t("title"), description: t("intro") };
}

/** Store contact details from the admin settings; empty fields are left out. */
async function Details() {
  const [{ store }, t] = await Promise.all([getPublicSettings(), getTranslations("content.contact")]);
  const rows: { icon: LucideIcon; label: string; value: string; href?: string }[] = [];
  if (store.email) rows.push({ icon: MailIcon, label: t("emailUs"), value: store.email, href: `mailto:${store.email}` });
  if (store.phone) {
    rows.push({ icon: PhoneIcon, label: t("callUs"), value: store.phone, href: `tel:${store.phone.replace(/\s+/g, "")}` });
  }
  if (store.address) rows.push({ icon: MapPinIcon, label: t("visit"), value: store.address });
  if (rows.length === 0) return null;

  return (
    <dl className="flex flex-col gap-6">
      {rows.map(({ icon: Icon, label, value, href }) => (
        <div key={label} className="flex gap-3">
          <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
          <div>
            <dt className="text-sm font-medium">{label}</dt>
            <dd className="mt-0.5 text-sm whitespace-pre-line text-muted-foreground">
              {href ? (
                <a href={href} className="hover:text-foreground hover:underline">
                  {value}
                </a>
              ) : (
                value
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export default async function ContactPage() {
  const t = await getTranslations("content.contact");
  return (
    <main className="flex-1 bg-surface py-14 lg:py-20">
      <Container className="grid items-start gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="font-heading text-4xl font-medium tracking-[-0.025em] md:text-5xl md:leading-[56px]">
              {t("title")}
            </h1>
            <p className="mt-4 text-[15px] leading-6 text-muted-foreground">{t("intro")}</p>
          </div>
          <Suspense>
            <Details />
          </Suspense>
        </div>
        <ContactForm />
      </Container>
    </main>
  );
}
