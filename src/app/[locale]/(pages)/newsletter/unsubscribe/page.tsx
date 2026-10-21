import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { NewsletterToken } from "@/components/content/NewsletterToken";
import { Container } from "@/components/shared/Container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("content.newsletter.unsubscribe");
  return { title: t("metaTitle"), robots: { index: false } };
}

// The link from a newsletter mail; ?token= is only known at request time.
export default function NewsletterUnsubscribePage() {
  return (
    <main className="flex-1 bg-surface py-16 lg:py-24">
      <Container className="max-w-lg">
        <Suspense>
          <NewsletterToken action="unsubscribe" />
        </Suspense>
      </Container>
    </main>
  );
}
