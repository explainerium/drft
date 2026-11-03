import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";
import { Container } from "@/components/shared/Container";
import { EditablePageLoader } from "@/components/siteTexts/EditablePageLoader";
import { getPage } from "@/lib/content";
import { isEditingTexts } from "@/lib/siteTexts/server";

type Props = PageProps<"/[locale]/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage((await params).slug);
  if (!page) return {};
  return { title: page.metaTitle ?? page.title, description: page.metaDescription ?? page.intro ?? undefined };
}

async function ContentPage({ params }: { params: Props["params"] }) {
  const [page, editing, locale] = await Promise.all([getPage((await params).slug), isEditingTexts(), getLocale()]);
  if (!page) notFound();

  const content = (
    <>
      <h1 className="font-heading text-4xl leading-tight font-medium tracking-[-0.025em] md:text-5xl md:leading-[56px]">
        {page.title}
      </h1>
      {page.intro && <p className="mt-5 text-lg leading-8 text-muted-foreground">{page.intro}</p>}
      {page.body && (
        <div
          className="rich-text mt-10 border-t pt-10 text-base leading-7 text-muted-foreground [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:mt-8"
          // Sanitized by the API (the editor's formatting only).
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      )}
    </>
  );

  return (
    <article className="py-14 lg:py-20">
      <Container className="max-w-3xl">
        {/* Staff editing the site can turn the content into an editor right here. */}
        {editing ? (
          <EditablePageLoader slug={page.slug} locale={locale}>
            {content}
          </EditablePageLoader>
        ) : (
          content
        )}
      </Container>
    </article>
  );
}

/**
 * Pages written in the admin, at the site root (/about, /warranty, /privacy).
 * The store's own routes take precedence; unknown or draft slugs are a 404.
 */
export default function Page({ params }: Props) {
  return (
    <main className="flex-1 bg-background">
      <Suspense fallback={<div aria-hidden className="mx-auto mt-14 h-80 max-w-3xl animate-pulse rounded-md bg-accent" />}>
        <ContentPage params={params} />
      </Suspense>
    </main>
  );
}
