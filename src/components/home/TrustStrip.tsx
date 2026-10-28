import { HeadsetIcon, LockIcon, RefreshCwIcon, TruckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";

const ITEMS = [
  { key: "shipping", Icon: TruckIcon },
  { key: "trial", Icon: RefreshCwIcon },
  { key: "warranty", Icon: LockIcon },
  { key: "advisory", Icon: HeadsetIcon },
] as const;

export function TrustStrip() {
  const t = useTranslations("home.trust");

  return (
    <section aria-label={t("label")} className="bg-secondary py-12">
      <Container>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ key, Icon }) => (
            <li key={key} className="flex gap-2">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-background shadow-xs" aria-hidden>
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold tracking-[-0.005em]">{t(`${key}.title`)}</h3>
                <p className="mt-0.5 text-sm leading-[22px] text-muted-foreground">{t(`${key}.body`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
