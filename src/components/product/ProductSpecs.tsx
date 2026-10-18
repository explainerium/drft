import { CircleCheckIcon, RecycleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";
import type { ProductSpec } from "@/types/catalog";

/** Technical specifications next to "What's in the box" and the circularity pledge. */
export function ProductSpecs({ specs, inTheBox }: { specs: ProductSpec[]; inTheBox?: string[] }) {
  const t = useTranslations("product.specs");
  const hasBox = !!inTheBox?.length;

  return (
    <section aria-labelledby="specs-title" className="bg-secondary py-16 lg:py-24">
      <Container className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_385px] lg:gap-8">
        {specs.length > 0 && (
          <div className="rounded-lg bg-card p-6 lg:p-7">
            <p className="text-xs font-semibold tracking-[0.1em] text-brand uppercase">{t("eyebrow")}</p>
            <h2 id="specs-title" className="mt-2 font-heading text-xl font-medium">
              {t("title")}
            </h2>
            <dl className="mt-6 border-t border-border">
              {specs.map((spec) => (
                <div
                  key={spec.id}
                  className="flex flex-col gap-1 border-b border-border py-3.5 text-sm last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <dt className="text-muted-foreground">{spec.label}</dt>
                  <dd className="font-medium sm:text-right">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {hasBox && (
            <div className="rounded-lg bg-card p-6 lg:p-7">
              <p className="text-xs font-semibold tracking-[0.1em] text-brand uppercase">{t("boxEyebrow")}</p>
              <h2 className="mt-2 font-heading text-xl font-medium">{t("boxTitle")}</h2>
              <ul className="mt-4 flex flex-col gap-3 text-sm">
                {inTheBox?.map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <CircleCheckIcon className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3 rounded-lg bg-accent p-6">
            <RecycleIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
            <div>
              <p className="font-heading text-[15px] font-medium">{t("pledgeTitle")}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{t("pledgeBody")}</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
