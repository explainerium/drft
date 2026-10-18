import { BadgeCheckIcon, TruckIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { CartSummary } from "@/types/cart";
import { formatPrice } from "@/utils/format";
import { toCents } from "@/utils/money";

/** "Complimentary EU Express Shipping unlocked", or how much is left to reach it. */
export function FreeShippingProgress({ summary }: { summary: CartSummary }) {
  const t = useTranslations("cart.shipping");
  const locale = useLocale();
  const { threshold, remaining, qualified } = summary.freeShipping;
  if (!threshold || remaining === null) return null;

  const percent = qualified ? 100 : Math.min(100, (toCents(summary.subtotal) / toCents(threshold)) * 100);
  const Icon = qualified ? BadgeCheckIcon : TruckIcon;

  return (
    <div className="flex flex-col gap-2.5 rounded-sm bg-secondary p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 text-sm font-medium tracking-[-0.005em]">
          <Icon className="size-4 shrink-0 text-brand" aria-hidden />
          {qualified ? t("unlocked") : t("almost", { remaining: formatPrice(remaining, locale) })}
        </p>
        <p className="shrink-0 text-xs font-medium tracking-[0.02em] text-muted-foreground">
          {qualified
            ? t("qualified", { threshold: formatPrice(threshold, locale) })
            : t("toGo", { remaining: formatPrice(remaining, locale) })}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={t("progress")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        className="h-1.5 overflow-hidden rounded-full bg-input"
      >
        <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
      {qualified && <p className="text-xs font-medium tracking-[0.02em] text-muted-foreground">{t("dispatch")}</p>}
    </div>
  );
}
