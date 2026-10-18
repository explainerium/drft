import { Grid3x3Icon, ScanIcon, SlidersHorizontalIcon } from "lucide-react";
import { Container } from "@/components/shared/Container";
import type { ProductContent } from "@/types/catalog";

// The design's three icons, reused in order for any number of items.
const ICONS = [ScanIcon, SlidersHorizontalIcon, Grid3x3Icon];

/** "Key innovations" bento: one card per item, with an optional footnote row. */
export function ProductFeatures({ features }: { features: NonNullable<ProductContent["features"]> }) {
  return (
    <section aria-labelledby="features-title" className="bg-surface py-16 lg:py-24">
      <Container>
        <p className="text-xs font-semibold tracking-[0.1em] text-brand uppercase">{features.eyebrow}</p>
        <h2 id="features-title" className="mt-3 font-heading text-3xl font-medium tracking-[-0.025em] md:text-4xl">
          {features.title}
        </h2>
        {features.intro && <p className="mt-2 max-w-xl text-[15px] leading-6 text-muted-foreground">{features.intro}</p>}

        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {features.items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={item.title} className="flex flex-col rounded-lg bg-card p-7">
                <span className="flex size-10 items-center justify-center rounded-md bg-secondary" aria-hidden>
                  <Icon className="size-5" />
                </span>
                <p className="mt-10 text-xs font-medium text-muted-foreground">{item.label}</p>
                <h3 className="mt-2 font-heading text-xl font-medium">{item.title}</h3>
                <p className="mt-3 mb-6 text-[15px] leading-6 text-muted-foreground">{item.body}</p>
                {(item.footnote || item.footnoteValue) && (
                  <p className="mt-auto flex justify-between gap-4 border-t border-border pt-5 text-xs text-muted-foreground">
                    <span>{item.footnote}</span>
                    <span className="font-semibold text-foreground">{item.footnoteValue}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
