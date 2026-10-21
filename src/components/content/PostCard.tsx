import { useFormatter, useTranslations } from "next-intl";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { PostCard as PostCardData } from "@/types/content";

export const JOURNAL_TIME_ZONE = "Europe/Amsterdam";

/** A journal post as a card: cover with the reading time, tag, title, excerpt. The whole card links. */
export function PostCard({
  post,
  large = false,
  priority = false,
  headingLevel = "h3",
}: {
  post: PostCardData;
  large?: boolean;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const t = useTranslations("content.journal");
  const format = useFormatter();
  const Heading = headingLevel;

  return (
    <article className={cn("group relative flex flex-col", large && "lg:grid lg:grid-cols-[3fr_2fr] lg:items-center lg:gap-12")}>
      <div className={cn("relative overflow-hidden rounded-md bg-accent", large ? "aspect-[16/9]" : "aspect-[357/223]")}>
        {post.cover && (
          <CatalogImageView
            image={post.cover}
            alt=""
            priority={priority}
            sizes={large ? "(min-width: 1280px) 700px, (min-width: 1024px) 60vw, 100vw" : "(min-width: 1280px) 357px, (min-width: 768px) 33vw, 100vw"}
            className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute top-3 left-3 rounded-sm bg-white/90 px-2.5 py-1 text-xs font-medium tracking-[0.02em] backdrop-blur-xs">
          {t("minutes", { count: post.readMinutes })}
        </span>
      </div>
      <div className={cn("flex flex-col", large && "lg:py-4")}>
        {post.tag && <p className="mt-4 text-xs font-medium tracking-[0.05em] text-brand uppercase lg:mt-4">{post.tag}</p>}
        <Heading
          className={cn(
            "mt-1 font-heading font-medium tracking-[-0.01em]",
            large ? "text-2xl leading-8 lg:text-[32px] lg:leading-10" : "text-xl leading-7",
          )}
        >
          <Link
            href={`/journal/${post.slug}`}
            className="outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
          >
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && (
          <p className={cn("mt-2 text-sm leading-[22px] text-muted-foreground", large ? "lg:text-base lg:leading-7" : "line-clamp-2")}>
            {post.excerpt}
          </p>
        )}
        <p className="mt-3 text-xs text-subtle-foreground">
          {format.dateTime(new Date(post.publishedAt), { dateStyle: "long", timeZone: JOURNAL_TIME_ZONE })}
        </p>
      </div>
    </article>
  );
}
