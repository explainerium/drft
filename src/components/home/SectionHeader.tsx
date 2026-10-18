import type { ReactNode } from "react";

/** Eyebrow + title on the left, intro or a link on the right (stacked on phones). */
export function SectionHeader({ id, eyebrow, title, aside }: { id: string; eyebrow: string; title: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-10">
      <div>
        <p className="text-xs font-medium tracking-[0.05em] text-muted-foreground uppercase">{eyebrow}</p>
        <h2 id={id} className="mt-1 font-heading text-3xl font-medium tracking-[-0.025em] md:text-4xl md:leading-[44px]">
          {title}
        </h2>
      </div>
      {aside}
    </div>
  );
}

/** Intro paragraph used as the header's right column. */
export function SectionIntro({ children }: { children: ReactNode }) {
  return <p className="max-w-[384px] text-[15px] leading-6 text-muted-foreground">{children}</p>;
}
