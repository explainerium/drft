import type { ReactNode } from "react";

/** One of the numbered checkout cards: "1 Customer Contact". */
export function CheckoutSection({
  step,
  title,
  aside,
  children,
  id,
}: {
  step: number;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  id: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-md bg-card p-5 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground"
          >
            {step}
          </span>
          <h2 id={id} className="font-heading text-xl leading-7 font-medium tracking-[-0.01em]">
            {title}
          </h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}
