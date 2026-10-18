"use client";

import { useIsClient } from "@/hooks/useIsClient";
import { CartPanel } from "./CartPanel";

/** The /cart page body: the drawer's panel with a page heading, rendered in the browser only. */
export function CartPageView() {
  if (!useIsClient()) return <div aria-hidden className="h-[480px] animate-pulse rounded-lg bg-card" />;
  return (
    <CartPanel
      className="overflow-hidden rounded-lg shadow-xs"
      heading={(title) => (
        <h1 className="font-heading text-3xl font-medium tracking-[-0.025em] sm:text-4xl sm:leading-[44px]">{title}</h1>
      )}
    />
  );
}
