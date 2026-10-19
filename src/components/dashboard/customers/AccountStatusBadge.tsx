import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { User } from "@/types/auth";

/** "Active" / "Suspended", plus "Unverified" while the email is not confirmed. */
export function AccountStatusBadge({ status, verified }: { status: User["status"]; verified: boolean }) {
  const t = useTranslations("admin.customers");
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <span
        className={cn(
          "rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap",
          status === "ACTIVE" ? "bg-success/10 text-emerald-700" : "bg-destructive/10 text-destructive",
        )}
      >
        {t(`status.${status}`)}
      </span>
      {!verified && (
        <span className="rounded-sm bg-secondary px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
          {t("unverified")}
        </span>
      )}
    </span>
  );
}
