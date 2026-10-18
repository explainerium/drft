import { BadgeCheckIcon, HeadsetIcon, TruckIcon, WavesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";

const ITEMS = [
  { key: "shipping", Icon: TruckIcon },
  { key: "returns", Icon: WavesIcon },
  { key: "warranty", Icon: BadgeCheckIcon },
  { key: "advice", Icon: HeadsetIcon },
] as const;

export function Reassurance() {
  const t = useTranslations("shop.reassurance");

  return (
    <section aria-label={t("label")} className="bg-secondary py-16 lg:py-20">
      <Container>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {ITEMS.map(({ key, Icon }) => (
            <li key={key} className="flex flex-col gap-1 rounded-md bg-background p-4 pb-8">
              <span className="mb-2 flex size-10 items-center justify-center rounded-xl bg-secondary" aria-hidden>
                <Icon className="size-[18px]" />
              </span>
              <h3 className="font-sans text-sm font-semibold tracking-[-0.005em]">{t(`${key}.title`)}</h3>
              <p className="text-sm leading-[22px] text-muted-foreground">{t(`${key}.body`)}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
