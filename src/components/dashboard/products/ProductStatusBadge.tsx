import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { ProductStatus } from "@/types/adminCatalog";

const STYLE: Record<ProductStatus, string> = {
  PUBLISHED: "bg-success/10 text-emerald-700",
  DRAFT: "bg-secondary text-muted-foreground",
  ARCHIVED: "bg-warning/10 text-amber-800",
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const t = useTranslations("admin.products.status");
  return (
    <span className={cn("rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap", STYLE[status])}>
      {t(status)}
    </span>
  );
}
