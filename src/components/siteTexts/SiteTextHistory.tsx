"use client";

import { useTranslations } from "next-intl";
import { useAdminFormat } from "@/components/dashboard/AdminPage";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Locale } from "@/i18n/routing";
import { useGetSiteTextHistoryQuery } from "@/redux/api/siteTextsApi";

/** Earlier versions of one text, newest first; "Use this" puts one back into the field (saving is separate). */
export function SiteTextHistory({
  textKey,
  defaults,
  onUse,
}: {
  textKey: string;
  defaults: Record<Locale, string>;
  onUse: (locale: Locale, value: string) => void;
}) {
  const t = useTranslations("admin.siteTexts");
  const format = useAdminFormat();
  const { data, isLoading, isError } = useGetSiteTextHistoryQuery(textKey);

  return (
    <section aria-label={t("history.title")} className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-muted-foreground">{t("history.title")}</h3>
      {isLoading ? (
        <Skeleton className="h-14" />
      ) : isError || !data?.length ? (
        <p className="text-sm text-muted-foreground">{t("history.empty")}</p>
      ) : (
        <ol className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {data.map((revision) => (
            <li key={revision.id} className="flex items-start gap-3 p-2.5">
              <span className="mt-0.5 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase">
                {revision.locale}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className={revision.value === null ? "text-sm text-muted-foreground italic" : "text-sm break-words whitespace-pre-line"}>
                  {revision.value ?? t("history.default")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("history.by", {
                    name: revision.changedBy ?? "—",
                    date: format.dateTime(revision.createdAt),
                  })}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => onUse(revision.locale, revision.value ?? defaults[revision.locale])}
              >
                {t("history.use")}
              </Button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
