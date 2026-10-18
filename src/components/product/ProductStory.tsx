import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { Container } from "@/components/shared/Container";
import type { ProductContent } from "@/types/catalog";

/** "Rider's perspective": story text with key figures, and the pull quote on a dark panel. */
export function ProductStory({ story }: { story: NonNullable<ProductContent["story"]> }) {
  return (
    <section aria-labelledby="story-title" className="bg-secondary py-16 lg:py-24">
      <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.1em] text-brand uppercase">{story.eyebrow}</p>
          <h2
            id="story-title"
            className="mt-3 font-heading text-3xl leading-tight font-medium tracking-[-0.025em] md:text-4xl md:leading-[44px]"
          >
            {story.title}
          </h2>
          <div className="mt-5 flex flex-col gap-4 text-[15px] leading-6 text-muted-foreground">
            {story.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
          {story.stats.length > 0 && (
            <dl className="mt-6 grid grid-cols-3 gap-2">
              {story.stats.map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse rounded-md bg-background p-4">
                  <dt className="mt-1 text-xs leading-4 text-muted-foreground">{stat.label}</dt>
                  <dd className="font-heading text-2xl md:text-[28px]">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {story.quote && (
          <figure className="relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-lg bg-[linear-gradient(160deg,#3c4a57_0%,#1d2730_45%,#0b1117_100%)] p-6 text-white lg:min-h-[586px] lg:p-7">
            {story.image && (
              <CatalogImageView
                image={story.image}
                alt=""
                sizes="(min-width: 1024px) 560px, 100vw"
                className="absolute inset-0 size-full object-cover"
              />
            )}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="relative">
              {story.quote.label && (
                <p className="text-xs font-medium tracking-[0.08em] text-white/80 uppercase">{story.quote.label}</p>
              )}
              <blockquote className="mt-2 font-heading text-xl leading-snug font-medium md:text-[22px]">
                “{story.quote.text}”
              </blockquote>
              <figcaption className="mt-3 text-sm text-white/80">— {story.quote.author}</figcaption>
            </div>
          </figure>
        )}
      </Container>
    </section>
  );
}
