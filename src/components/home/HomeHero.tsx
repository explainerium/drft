import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import heroImage from "@/assets/images/home/hero-tarifa.jpg";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";

/** One full-bleed photo with the headline and the two main ways in: products and the brand. */
export function HomeHero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative isolate overflow-hidden bg-black text-white">
      <Image
        src={heroImage}
        alt=""
        fill
        sizes="100vw"
        placeholder="blur"
        priority
        className="-z-10 object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      <Container className="flex min-h-[560px] flex-col justify-end pt-24 pb-16 lg:min-h-[720px] lg:pb-24">
        <p className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase">
          <span className="size-1.5 rounded-full bg-brand-bright" aria-hidden />
          {t("eyebrow")}
        </p>
        <h1 className="mt-5 max-w-3xl font-heading text-5xl leading-none font-semibold tracking-[-0.025em] whitespace-pre-line uppercase md:text-6xl md:leading-[60px]">
          {t("title")}
        </h1>
        <p className="mt-5 max-w-[520px] text-base leading-relaxed text-white/85 md:text-lg md:leading-[29px]">
          {t("body")}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-bright px-8 text-sm font-semibold tracking-[0.02em] text-black uppercase transition-colors hover:bg-white"
          >
            {t("primary")}
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="/ueber-drft"
            className="inline-flex h-12 items-center rounded-xl bg-white/15 px-7 text-sm font-medium tracking-[0.02em] uppercase backdrop-blur-md transition-colors hover:bg-white/25"
          >
            {t("secondary")}
          </Link>
        </div>
      </Container>
    </section>
  );
}
