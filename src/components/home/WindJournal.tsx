import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Container } from "@/components/shared/Container";
import { JOURNAL_POSTS } from "@/constants/home";
import { Link } from "@/i18n/navigation";
import { SectionHeader } from "./SectionHeader";

/** Latest journal posts. Static copy until the journal is built. */
export function WindJournal() {
  const t = useTranslations("home.journal");

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
          {JOURNAL_POSTS.map(({ key, href, image }) => (
            <li key={key}>
              <article className="group relative flex flex-col">
                <div className="relative aspect-[357/223] overflow-hidden rounded-md bg-accent">
                  <Image
                    src={image}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 357px, (min-width: 768px) 33vw, 100vw"
                    placeholder="blur"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute top-3 left-3 rounded-sm bg-white/90 px-2.5 py-1 text-xs font-medium tracking-[0.02em] backdrop-blur-xs">
                    {t(`posts.${key}.meta`)}
                  </span>
                </div>
                <p className="mt-4 text-xs font-medium tracking-[0.05em] text-brand uppercase">{t(`posts.${key}.tag`)}</p>
                <h3 className="mt-1 font-heading text-xl leading-7 font-medium tracking-[-0.01em]">
                  <Link
                    href={href}
                    className="outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
                  >
                    {t(`posts.${key}.title`)}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-[22px] text-muted-foreground">{t(`posts.${key}.excerpt`)}</p>
                <span
                  aria-hidden
                  className="mt-2 self-start border-b border-border pr-11 pb-0.5 text-sm font-medium group-hover:border-foreground"
                >
                  {t("readStory")} →
                </span>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
