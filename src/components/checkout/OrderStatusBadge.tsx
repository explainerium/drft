import { CircleCheckIcon, ClockIcon, CircleXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/checkout";

const ENDED: OrderStatus[] = ["CANCELLED", "REFUNDED", "PARTIALLY_REFUNDED"];

/** "AWAITING PAYMENT", "PAID", "SHIPPED", ... as a small coloured chip. */
export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const t = useTranslations("order.status");
  const pending = status === "PENDING_PAYMENT";
  const ended = ENDED.includes(status);
  const Icon = pending ? ClockIcon : ended ? CircleXIcon : CircleCheckIcon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium tracking-[0.05em] whitespace-nowrap uppercase",
        ended
          ? "bg-destructive/10 text-destructive"
          : pending
            ? "bg-warning/10 text-warning"
            : "bg-brand-soft text-brand",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {t(status)}
    </span>
  );
}
