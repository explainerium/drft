import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PostCard } from "@/components/content/PostCard";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";
import { Pagination } from "@/components/shop/Pagination";
import { getPostTags, getPosts } from "@/lib/content";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/constants/features";

const PAGE_SIZE = 9;

type Props = PageProps<"/[locale]/journal">;

export async function generateMetadata(): Promise<Metadata> {
  if (!FEATURES.journal) return {};
  const t = await getTranslations("content.journal");
  return { title: t("title"), description: t("intro") };
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** "All" plus one chip per tag in use; the active one is filled. */
async function TagFilter({ active }: { active?: string }) {
  const [tags, t] = await Promise.all([getPostTags(), getTranslations("content.journal")]);
  if (tags.length < 2) return null;
  const chip = (selected: boolean) =>
    cn(
      "inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium transition-colors",
      selected ? "border-foreground bg-foreground text-background" : "bg-background hover:border-foreground/40"
    );
  return (
    <nav aria-label={t("tags")} className="mt-10">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link href="/journal" className={chip(!active)} aria-current={!active ? "page" : undefined}>
            {t("allTags")}
          </Link>
        </li>
        {tags.map(({ tag }) => (
          <li key={tag}>
            <Link
              href={{ pathname: "/journal", query: { tag } }}
              className={chip(active === tag)}
              aria-current={active === tag ? "page" : undefined}
            >
              {tag}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

async function Posts({ searchParams }: { searchParams: Props["searchParams"] }) {
  const params = await searchParams;
  const page = Math.max(1, Number(first(params.page)) || 1);
  const tag = first(params.tag)?.trim().slice(0, 40) || undefined;
  const [{ data: posts, meta }, t] = await Promise.all([
    getPosts({ page, limit: PAGE_SIZE, ...(tag ? { tag } : {}) }),
    getTranslations("content.journal"),
  ]);

  if (posts.length === 0) {
    return (
      <>
        <TagFilter active={tag} />
        <p className="py-16 text-center text-muted-foreground">{tag ? t("emptyTag") : t("empty")}</p>
      </>
    );
  }
  // The newest post leads the first unfiltered page.
  const lead = page === 1 && !tag ? posts[0] : null;
  const rest = lead ? posts.slice(1) : posts;

  return (
    <>
      <TagFilter active={tag} />
      {lead && (
        <div className="mt-12">
          <PostCard post={lead} large priority headingLevel="h2" />
        </div>
      )}
      {rest.length > 0 && (
        <ul
          className={cn(
            "grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-10",
            lead ? "mt-14 border-t pt-14" : "mt-10"
          )}
        >
          {rest.map((post) => (
            <li key={post.id}>
              <PostCard post={post} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-14">
        <Pagination page={meta.page} totalPages={meta.totalPages} pathname="/journal" query={tag ? { tag } : {}} />
      </div>
    </>
  );
}

export default async function JournalPage({ searchParams }: Props) {
  if (!FEATURES.journal) notFound();
  const t = await getTranslations("content.journal");
  return (
    <main className="flex-1 bg-surface py-14 lg:py-20">
      <Container>
        <header className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{t("eyebrow")}</p>
          <h1 className="mt-1 font-heading text-4xl font-medium tracking-[-0.025em] md:text-5xl md:leading-[56px]">
            {t("title")}
          </h1>
          <p className="mt-4 text-[15px] leading-6 text-muted-foreground">{t("intro")}</p>
        </header>
        {/* ?page= is only known at request time. */}
        <Suspense fallback={<div aria-hidden className="mt-12 aspect-[16/7] animate-pulse rounded-md bg-accent" />}>
          <Posts searchParams={searchParams} />
        </Suspense>
      </Container>
    </main>
  );
}
