import { HammerIcon, SlidersHorizontalIcon, WavesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";

const TENETS = [
  { key: "innovation", Icon: WavesIcon },
  { key: "sensation", Icon: SlidersHorizontalIcon },
  { key: "craft", Icon: HammerIcon },
] as const;

/** Brand statement quote and the three core tenets. */
export function DesignPhilosophy() {
  const t = useTranslations("home.philosophy");

  return (
    <section aria-labelledby="philosophy-title" className="bg-secondary py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-[896px] text-center">
          <p className="text-xs font-medium tracking-[0.1em] text-muted-foreground uppercase">{t("eyebrow")}</p>
          <h2
            id="philosophy-title"
            className="mx-auto mt-2 max-w-[804px] font-heading text-2xl leading-snug font-medium tracking-[-0.025em] text-balance md:text-4xl md:leading-[50px]"
          >
            {t("quote")}
          </h2>
        </div>

        <ul className="mt-12 grid gap-6 md:grid-cols-3 lg:mt-20 lg:gap-10">
          {TENETS.map(({ key, Icon }) => (
            <li key={key} className="flex flex-col rounded-lg bg-card p-8 shadow-xs lg:p-12">
              <span className="flex size-12 items-center justify-center rounded-sm bg-accent" aria-hidden>
                <Icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-medium tracking-[0.02em] text-brand">{t(`${key}.label`)}</p>
              <h3 className="mt-1 font-heading text-xl leading-7 font-medium tracking-[-0.01em]">{t(`${key}.title`)}</h3>
              <p className="mt-2 text-[15px] leading-6 text-muted-foreground">{t(`${key}.body`)}</p>
              <p className="mt-auto pt-8 text-xs font-medium text-muted-foreground">{t(`${key}.note`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
