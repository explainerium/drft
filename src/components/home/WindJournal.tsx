import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PostCard } from "@/components/content/PostCard";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";
import { getPosts } from "@/lib/content";
import { SectionHeader } from "./SectionHeader";

/** The three latest journal posts. */
export async function WindJournal() {
  const [{ data: posts }, t] = await Promise.all([getPosts({ limit: 3 }), getTranslations("home.journal")]);
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="journal-title" className="bg-surface py-16 lg:py-20">
      <Container>
        <SectionHeader
          id="journal-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          aside={
            <Link href="/journal" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
              {t("viewAll")}
              <ArrowRightIcon className="size-4" />
            </Link>
          }
        />
        <ul className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
