import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import aboutImage from "@/assets/images/home/spotlight-aero.jpg";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";

/** A short word about the brand, leading to the "Über DRFT" page. */
export function AboutTeaser() {
  const t = useTranslations("home.about");

  return (
    <section aria-labelledby="about-title" className="bg-background py-16 lg:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
          <Image src={aboutImage} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" placeholder="blur" className="object-cover" />
        </div>
        <div className="max-w-lg">
          <p className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">
            <span className="size-1.5 rounded-full bg-brand-bright" aria-hidden />
            {t("eyebrow")}
          </p>
          <h2 id="about-title" className="mt-3 font-heading text-3xl leading-tight font-medium tracking-[-0.025em] md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{t("body")}</p>
          <Link
            href="/ueber-drft"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            {t("link")}
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
