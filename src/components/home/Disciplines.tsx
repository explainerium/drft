import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Container } from "@/components/shared/Container";
import { DISCIPLINES } from "@/constants/home";
import { Link } from "@/i18n/navigation";
import { findCategory, getCategoryTree } from "@/lib/catalog";
import { SectionHeader, SectionIntro } from "./SectionHeader";

/** Discipline cards linking to the category listings; the photo is the category image set in the admin. */
export async function Disciplines() {
  const [tree, t] = await Promise.all([getCategoryTree(), getTranslations("home.disciplines")]);

  return (
    <section aria-labelledby="disciplines-title" className="bg-surface py-16 lg:py-20">
      <Container>
        <SectionHeader
          id="disciplines-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          aside={<SectionIntro>{t("intro")}</SectionIntro>}
        />
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {DISCIPLINES.map(({ key, category }) => {
            const image = findCategory(tree, category)?.category.image;
            return (
              <li key={key}>
                <Link
                  href={`/shop/${category}`}
                  className="group relative flex aspect-[368/487] flex-col justify-end overflow-hidden rounded-lg bg-accent p-6 text-white shadow-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {image && (
                    <CatalogImageView
                      image={image}
                      alt=""
                      sizes="(min-width: 1280px) 368px, (min-width: 768px) 33vw, 100vw"
                      className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="relative">
                    <p className="text-xs font-medium tracking-[0.02em] text-[#e5e2e1]">{t(`${key}.label`)}</p>
                    <h3 className="mt-1 font-heading text-xl leading-7 font-medium tracking-[-0.01em]">
                      {t(`${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-[22px] text-[#e5e2e1]">{t(`${key}.body`)}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium group-hover:underline">
                      {t(`${key}.cta`)}
                      <ArrowRightIcon className="size-4" />
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
