import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/checkout";

/** Colour by what staff do next: ship it (ocean), wait (amber), done (green), stopped (red). */
const TONE: Record<OrderStatus, string> = {
  PAID: "bg-brand-soft/70 text-brand [--dot:var(--brand)]",
  PROCESSING: "bg-brand-soft/70 text-brand [--dot:var(--brand)]",
  PARTIALLY_REFUNDED: "bg-brand-soft/70 text-brand [--dot:var(--brand)]",
  PENDING_PAYMENT: "bg-signal-soft text-signal [--dot:var(--signal)]",
  SHIPPED: "bg-[#e6f6f9] text-[#0e6f86] [--dot:#06b6d4]",
  DELIVERED: "bg-success/10 text-emerald-700 [--dot:var(--success)]",
  CANCELLED: "bg-destructive/10 text-destructive [--dot:var(--destructive)]",
  REFUNDED: "bg-destructive/10 text-destructive [--dot:var(--destructive)]",
};

/** Order status in the admin: a dot and the status name, in sentence case. */
export function StatusPill({ status, className }: { status: OrderStatus; className?: string }) {
  const t = useTranslations("order.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE[status],
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-(--dot)" />
      {t(status)}
    </span>
  );
}
