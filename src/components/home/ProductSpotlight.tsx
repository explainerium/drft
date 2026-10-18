import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import spotlightImage from "@/assets/images/home/spotlight-aero.jpg";
import { Container } from "@/components/shared/Container";
import { SPOTLIGHT_PRODUCT_SLUG } from "@/constants/home";
import { Link } from "@/i18n/navigation";
import { getProduct } from "@/lib/catalog";
import { formatPrice } from "@/utils/format";
import { defaultVariant } from "@/utils/variants";

const POINTS = ["frame", "relaunch", "pressure"] as const;

/** "Flagship innovation" deep dive. Name and price come from the product; photo and copy are editorial. */
export async function ProductSpotlight() {
  const [product, t, locale] = await Promise.all([
    getProduct(SPOTLIGHT_PRODUCT_SLUG),
    getTranslations("home.spotlight"),
    getLocale(),
  ]);
  if (!product) return null;

  const price = defaultVariant(product.variants)?.price ?? product.price.min;

  return (
    <section aria-labelledby="spotlight-title" className="bg-secondary py-16 lg:py-20">
      <Container>
        <div className="grid overflow-hidden rounded-lg bg-card shadow-xs lg:grid-cols-[minmax(0,672fr)_minmax(0,480fr)]">
          <div className="relative aspect-[4/3] bg-accent lg:aspect-auto lg:min-h-[865px]">
            <Image
              src={spotlightImage}
              alt={t("imageAlt", { name: product.name })}
              fill
              sizes="(min-width: 1280px) 672px, (min-width: 1024px) 58vw, 100vw"
              placeholder="blur"
              className="object-cover"
            />
            <p className="absolute bottom-6 left-6 rounded-sm bg-white/90 px-3 py-2 text-xs leading-4 shadow-xs backdrop-blur-xs">
              <span className="block font-semibold tracking-[0.02em] uppercase">{t("materialTitle")}</span>
              <span className="mt-0.5 block font-medium text-muted-foreground">{t("materialBody")}</span>
            </p>
          </div>

          <div className="flex flex-col justify-center p-8 md:p-12 lg:p-20">
            <p className="flex items-center gap-2 text-xs font-medium tracking-[0.05em] text-brand uppercase">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              {t("eyebrow")}
            </p>
            <h2
              id="spotlight-title"
              className="mt-2 font-heading text-3xl font-medium tracking-[-0.025em] md:text-4xl md:leading-[44px]"
            >
              {product.name}
            </h2>
            <p className="mt-1 text-[15px] leading-6 text-muted-foreground">{t("body")}</p>

            <ul className="mt-5 flex flex-col gap-4">
              {POINTS.map((key) => (
                <li key={key} className="flex gap-2">
                  <CircleCheckIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold tracking-[-0.005em]">{t(`points.${key}.title`)}</p>
                    <p className="text-sm leading-[22px] text-muted-foreground">{t(`points.${key}.body`)}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-12 rounded-lg bg-secondary p-6 shadow-xs">
              {price && (
                <p className="flex flex-wrap items-baseline gap-x-2 border-b border-border pb-4">
                  <span className="font-heading text-[38px] leading-[46px] font-semibold tracking-[-0.015em]">
                    {formatPrice(price, locale)}
                  </span>
                  <span className="text-xs font-medium tracking-[0.02em] text-muted-foreground">{t("currency")}</span>
                  <span className="basis-full text-xs font-medium tracking-[0.02em] text-muted-foreground">
                    {t("vat")}
                  </span>
                </p>
              )}
              <Link
                href={`/products/${product.slug}`}
                className="mt-4 flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow-xs transition-colors hover:bg-primary/85"
              >
                {t("configure")}
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
