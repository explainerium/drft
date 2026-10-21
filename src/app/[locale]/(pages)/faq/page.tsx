import { ChevronDownIcon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";
import { getFaq } from "@/lib/content";
import type { FaqGroup } from "@/types/content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content.faq");
  return { title: t("title"), description: t("intro") };
}

const stripTags = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

/** schema.org FAQPage, so search engines can show the answers. */
function faqJsonLd(groups: FaqGroup[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: stripTags(item.answer) },
      })),
    ),
  };
}

async function Questions() {
  const [groups, t] = await Promise.all([getFaq(), getTranslations("content.faq")]);
  if (groups.length === 0) return <p className="mt-10 text-muted-foreground">{t("empty")}</p>;

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(groups)).replace(/</g, "\\u003c") }}
      />
      <div className="mt-12 flex flex-col gap-12">
        {groups.map((group) => (
          <section key={group.group ?? "other"} aria-label={group.group ?? t("other")}>
            <h2 className="font-heading text-xl font-medium tracking-[-0.01em]">{group.group ?? t("other")}</h2>
            <div className="mt-4 divide-y border-y">
              {group.items.map((item) => (
                <details key={item.id} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-left text-[15px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDownIcon
                      className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <div
                    className="rich-text pb-5 text-[15px] leading-7 text-muted-foreground"
                    // Sanitized by the API (the editor's formatting only).
                    dangerouslySetInnerHTML={{ __html: item.answer }}
                  />
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export default async function FaqPage() {
  const t = await getTranslations("content.faq");
  return (
    <main className="flex-1 bg-background py-14 lg:py-20">
      <Container className="max-w-3xl">
        <h1 className="font-heading text-4xl font-medium tracking-[-0.025em] md:text-5xl md:leading-[56px]">{t("title")}</h1>
        <p className="mt-4 text-[15px] leading-6 text-muted-foreground">{t("intro")}</p>
        <Suspense fallback={<div aria-hidden className="mt-12 h-64 animate-pulse rounded-md bg-accent" />}>
          <Questions />
        </Suspense>
        <p className="mt-14 rounded-md bg-surface px-5 py-4 text-sm">
          {t("stillStuck")}{" "}
          <Link href="/contact" className="font-medium text-brand hover:underline">
            {t("contact")}
          </Link>
        </p>
      </Container>
    </main>
  );
}
