import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { JOURNAL_TIME_ZONE, PostCard } from "@/components/content/PostCard";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";
import { getPost } from "@/lib/content";
import type { Post } from "@/types/content";
import { FEATURES } from "@/constants/features";

type Props = PageProps<"/[locale]/journal/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!FEATURES.journal) return {};
  const post = await getPost((await params).slug);
  if (!post) return {};
  const image = post.cover?.sizes.large?.url ?? post.cover?.url;
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    openGraph: {
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

/** schema.org BlogPosting, so search engines can show the date and image. */
function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.cover ? [post.cover.url] : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author ? { "@type": "Organization", name: post.author } : undefined,
    publisher: { "@type": "Organization", name: "DRFT" },
  };
}

async function Article({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const [post, t, format] = await Promise.all([getPost(slug), getTranslations("content.journal"), getFormatter()]);
  if (!post) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(post)).replace(/</g, "\\u003c") }}
      />
      <article className="bg-background pt-10 pb-16 lg:pt-14 lg:pb-24">
        <Container className="max-w-4xl">
          <Link href="/journal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeftIcon className="size-4" />
            {t("back")}
          </Link>
          <header className="mt-8">
            {post.tag && <p className="text-xs font-medium tracking-[0.05em] text-brand uppercase">{post.tag}</p>}
            <h1 className="mt-2 font-heading text-3xl leading-tight font-medium tracking-[-0.025em] md:text-[44px] md:leading-[52px]">
              {post.title}
            </h1>
            {post.excerpt && <p className="mt-4 text-lg leading-8 text-muted-foreground">{post.excerpt}</p>}
            <p className="mt-5 text-sm text-subtle-foreground">
              {[
                format.dateTime(new Date(post.publishedAt), { dateStyle: "long", timeZone: JOURNAL_TIME_ZONE }),
                t("minutes", { count: post.readMinutes }),
                post.author ? t("by", { author: post.author }) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </header>
        </Container>
        {post.cover && (
          <Container className="mt-10 max-w-6xl">
            <div className="relative aspect-[16/8] overflow-hidden rounded-md bg-accent">
              <CatalogImageView
                image={post.cover}
                priority
                sizes="(min-width: 1280px) 1152px, 100vw"
                className="absolute inset-0 size-full object-cover"
              />
            </div>
          </Container>
        )}
        {post.body && (
          <Container className="mt-12 max-w-3xl">
            <div
              className="rich-text text-[17px] leading-8 text-muted-foreground [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:mt-8"
              // Sanitized by the API (the editor's formatting only).
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </Container>
        )}
      </article>
      {post.more.length > 0 && (
        <section aria-labelledby="more-title" className="bg-surface py-16 lg:py-20">
          <Container>
            <h2 id="more-title" className="font-heading text-2xl font-medium tracking-[-0.02em] md:text-3xl">
              {t("more")}
            </h2>
            <ul className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
              {post.more.map((other) => (
                <li key={other.id}>
                  <PostCard post={other} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}
    </>
  );
}

// Posts change in the admin, so pages render on request from the cached reads.
export default function JournalPostPage({ params }: Props) {
  if (!FEATURES.journal) notFound();
  return (
    <main className="flex-1">
      <Suspense fallback={<div aria-hidden className="mx-auto mt-14 h-96 max-w-4xl animate-pulse rounded-md bg-accent" />}>
        <Article params={params} />
      </Suspense>
    </main>
  );
}
