"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Ref } from "react";
import { useAdminFormat } from "@/components/dashboard/AdminPage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/i18n/routing";
import { checkText, placeholdersOf, type TextIssue } from "@/lib/siteTexts/check";
import type { StoredSiteText } from "@/redux/api/siteTextsApi";
import { changeOf } from "./siteTexts";

type Translate = ReturnType<typeof useTranslations<"admin.siteTexts">>;

export function issueMessage(t: Translate, issue: TextIssue): string {
  switch (issue.kind) {
    case "syntax":
      return t("issues.syntax");
    case "unknownValue":
      return t("issues.unknownValue", { name: `{${issue.name}}` });
    case "unknownTag":
      return t("issues.unknownTag", { name: `<${issue.name}>` });
    case "valueUse":
      return t("issues.valueUse", { name: `{${issue.name}}` });
  }
}

/**
 * One language of one site text: the text, a way back to the default, and a
 * note on what the page fills in, what is wrong, or who changed it last.
 */
export function SiteTextField({
  id,
  locale,
  value,
  original,
  stored,
  onChange,
  autoFocus,
  textareaRef,
}: {
  id: string;
  locale: Locale;
  value: string;
  original: string;
  stored: StoredSiteText | undefined;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  textareaRef?: Ref<HTMLTextAreaElement>;
}) {
  const t = useTranslations("admin.siteTexts");
  const format = useAdminFormat();
  const text = changeOf(value, original);
  const check = text ? checkText(text, original) : null;
  const placeholders = placeholdersOf(original);
  const showsStored = !!stored && text === stored.value;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex min-h-6 items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium">
          {t(`languages.${locale}`)}
        </label>
        {text && (
          <Button type="button" variant="ghost" size="xs" onClick={() => onChange(original)}>
            <RotateCcwIcon />
            {t("useDefault")}
          </Button>
        )}
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        lang={locale}
        rows={1}
        value={value}
        placeholder={original}
        autoFocus={autoFocus}
        aria-invalid={!!check?.issue}
        aria-describedby={`${id}-note`}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-9"
      />
      <div id={`${id}-note`} className="flex flex-col gap-0.5 text-xs">
        {check?.issue ? (
          <p className="font-medium text-destructive">{issueMessage(t, check.issue)}</p>
        ) : check?.dropped.length ? (
          <p className="text-signal">{t("dropped", { list: check.dropped.join(", ") })}</p>
        ) : (
          placeholders.length > 0 && (
            <p className="text-muted-foreground">{t("filledIn", { list: placeholders.join(", ") })}</p>
          )
        )}
        {text && <p className="line-clamp-2 text-muted-foreground">{t("default", { text: original })}</p>}
        {showsStored && (
          <p className="text-muted-foreground">
            {stored.updatedBy
              ? t("changedBy", { name: stored.updatedBy, date: format.dateTime(stored.updatedAt) })
              : t("changedOn", { date: format.dateTime(stored.updatedAt) })}
          </p>
        )}
      </div>
    </div>
  );
}
