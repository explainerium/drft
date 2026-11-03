"use client";

import { ExternalLinkIcon, HistoryIcon, MousePointerClickIcon, SearchIcon, Settings2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SiteTextField } from "@/components/siteTexts/SiteTextField";
import { SiteTextHistory } from "@/components/siteTexts/SiteTextHistory";
import {
  SITE_TEXT_GROUPS,
  changeOf,
  groupOf,
  isEditableText,
  issueOf,
  storedById,
  textId,
  textLabel,
  type SiteTextDefaults,
  type SiteTextGroup,
} from "@/components/siteTexts/siteTexts";
import { useTextEditing } from "@/components/siteTexts/useTextEditing";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_LINKS } from "@/constants/admin";
import { routing, type Locale } from "@/i18n/routing";
import { announceSiteChange, useSiteChanges } from "@/lib/siteTexts/sync";
import { cn } from "@/lib/utils";
import { revalidateTags } from "@/redux/api/adminCatalogApi";
import { useGetAdminPagesQuery, type AdminPageRow } from "@/redux/api/adminContentApi";
import {
  useGetStoredSiteTextsQuery,
  useSaveSiteTextsMutation,
  type SiteTextChange,
  type StoredSiteText,
} from "@/redux/api/siteTextsApi";
import { apiErrorMessage } from "@/utils/apiError";
import { PageHeader, QueryError, useAdminFormat } from "../AdminPage";
import { ContentStatusBadge } from "./ContentLists";

const LOCALES = routing.locales;

/**
 * Every storefront text in both languages, by section of the site. Edits stay
 * in the browser until "Save changes", which stores them in one go and
 * refreshes the site. `?key=home.hero.title` opens that text (the on-page
 * editor links here). The page content of the about and legal pages is listed
 * too (`?section=pages`). "Edit on the site" opens the site in a new tab; saves
 * there show up here at once, and saves here refresh that tab.
 */
export function SiteTextsView({ defaults }: { defaults: SiteTextDefaults }) {
  const t = useTranslations("admin.siteTexts");
  const tc = useTranslations("admin.common");
  const params = useSearchParams();
  const focusKey = params.get("key");
  const { data, isLoading, isError, refetch } = useGetStoredSiteTextsQuery();
  const [save] = useSaveSiteTextsMutation();
  const { start } = useTextEditing();

  const keys = useMemo(() => Object.keys(defaults.de).filter(isEditableText), [defaults]);
  const stored = useMemo(() => storedById(data), [data]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const pages = useGetAdminPagesQuery();
  // Saved on the site in another tab: reload, then say why the list just changed.
  useSiteChanges(async (change) => {
    await (change === "texts" ? refetch() : pages.refetch());
    toast(t("liveUpdated"));
  });
  // A section of texts, or "pages": the content of the about and legal pages.
  const [group, setGroup] = useState<SiteTextGroup | "pages">(() =>
    focusKey && isEditableText(focusKey)
      ? groupOf(focusKey)
      : params.get("section") === "pages"
        ? "pages"
        : SITE_TEXT_GROUPS[0].key,
  );
  const [query, setQuery] = useState("");
  // Saving covers the refresh of the site and of the list, not only the request.
  const [busy, setBusy] = useState(false);
  const [onlyChanged, setOnlyChanged] = useState(false);

  const valueOf = (locale: Locale, key: string) =>
    drafts[textId(locale, key)] ?? stored.get(textId(locale, key))?.value ?? defaults[locale][key];
  const isChanged = (key: string) => LOCALES.some((locale) => stored.has(textId(locale, key)));

  // What "Save changes" would send: drafts that differ from what is stored.
  const changes = useMemo(
    () =>
      Object.entries(drafts).flatMap(([id, value]): SiteTextChange[] => {
        const at = id.indexOf(":");
        const [locale, key] = [id.slice(0, at) as Locale, id.slice(at + 1)];
        const next = changeOf(value, defaults[locale][key]);
        return next === (stored.get(id)?.value ?? "") ? [] : [{ key, locale, value: next }];
      }),
    [drafts, stored, defaults],
  );
  const invalid = changes.filter((change) => issueOf(change.value, defaults[change.locale][change.key]));

  const changedByGroup = useMemo(() => {
    const counts = new Map<SiteTextGroup, number>();
    for (const key of keys) {
      if (LOCALES.some((locale) => stored.has(textId(locale, key)))) {
        counts.set(groupOf(key), (counts.get(groupOf(key)) ?? 0) + 1);
      }
    }
    return counts;
  }, [keys, stored]);
  const changedCount = [...changedByGroup.values()].reduce((sum, n) => sum + n, 0);

  // Searching and "Changed" look across every section; otherwise one section at a time.
  const search = query.trim().toLocaleLowerCase();
  const across = !!search || onlyChanged;
  const visible = keys.filter((key) => {
    if (!across && groupOf(key) !== group) return false;
    if (onlyChanged && !isChanged(key)) return false;
    if (!search) return true;
    return [key, textLabel(key), ...LOCALES.flatMap((locale) => [defaults[locale][key], valueOf(locale, key)])].some(
      (text) => text.toLocaleLowerCase().includes(search),
    );
  });

  // A deep link opens its text: scroll to it and put the cursor in the first field.
  useEffect(() => {
    if (!focusKey || isLoading) return;
    const row = document.getElementById(rowId(focusKey));
    row?.scrollIntoView({ block: "center" });
    row?.querySelector("textarea")?.focus({ preventScroll: true });
  }, [focusKey, isLoading]);

  // Unsaved edits: ask before the tab closes or reloads.
  const dirty = changes.length > 0;
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const setDraft = (locale: Locale, key: string, value: string) =>
    setDrafts((current) => ({ ...current, [textId(locale, key)]: value }));

  const onSave = async () => {
    if (invalid.length) {
      toast.error(t("fixFirst"));
      const first = invalid[0].key;
      if (!across) setGroup(groupOf(first));
      requestAnimationFrame(() => document.getElementById(rowId(first))?.scrollIntoView({ block: "center" }));
      return;
    }
    setBusy(true);
    try {
      await save(changes).unwrap();
      await Promise.all([revalidateTags(["site-texts"]), refetch()]);
      announceSiteChange("texts");
      setDrafts({});
      toast.success(t("saved", { count: changes.length }));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    } finally {
      setBusy(false);
    }
  };

  const editOnSite = async (path: string) => {
    if (!(await start(path, { newTab: true }))) toast.error(t("editor.failedToStart"));
  };
  const firstPage = pages.data?.find((item) => item.status === "PUBLISHED");
  const sitePath =
    group === "pages"
      ? firstPage
        ? `/${firstPage.slug}`
        : "/"
      : (SITE_TEXT_GROUPS.find((item) => item.key === group)?.path ?? "/");

  return (
    <div className="flex flex-col gap-6 pb-24">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button size="lg" title={t("editOnSiteHint")} onClick={() => editOnSite(sitePath)}>
            <MousePointerClickIcon />
            {t("editOnSite")}
            <ExternalLinkIcon data-icon="inline-end" className="opacity-80" />
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <div role="search" className="relative min-w-60 flex-1 sm:max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-9 w-full rounded-lg border border-input bg-card pr-9 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label={tc("clearSearch")}
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
            >
              <XIcon className="size-3.5" />
            </button>
          )}
        </div>
        <div role="group" aria-label={t("sections")} className="flex rounded-lg border border-input bg-card p-0.5">
          {([false, true] as const).map((changed) => (
            <button
              key={String(changed)}
              type="button"
              aria-pressed={onlyChanged === changed}
              onClick={() => setOnlyChanged(changed)}
              className="h-8 rounded-md px-3 text-sm text-muted-foreground aria-pressed:bg-muted aria-pressed:font-medium aria-pressed:text-foreground"
            >
              {changed ? t("changed", { count: changedCount }) : t("all")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <nav aria-label={t("sections")} className={cn("lg:sticky lg:top-20 lg:self-start", across && "opacity-50")}>
          <ul className="flex scrollbar-none gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SITE_TEXT_GROUPS.map((item) => {
              const current = !across && item.key === group;
              const changed = changedByGroup.get(item.key) ?? 0;
              return (
                <li key={item.key} className="shrink-0">
                  <button
                    type="button"
                    aria-current={current ? "true" : undefined}
                    onClick={() => {
                      setGroup(item.key);
                      setQuery("");
                      setOnlyChanged(false);
                    }}
                    className="flex h-9 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-foreground aria-[current=true]:bg-card aria-[current=true]:font-medium aria-[current=true]:text-foreground aria-[current=true]:shadow-xs"
                  >
                    {t(`groups.${item.key}`)}
                    {changed > 0 && (
                      <span className="rounded-md bg-brand-soft px-1.5 text-xs font-medium text-brand">{changed}</span>
                    )}
                  </button>
                </li>
              );
            })}
            <li className="shrink-0 lg:mt-2 lg:border-t lg:border-border lg:pt-2">
              <button
                type="button"
                aria-current={!across && group === "pages" ? "true" : undefined}
                onClick={() => {
                  setGroup("pages");
                  setQuery("");
                  setOnlyChanged(false);
                }}
                className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-sm whitespace-nowrap text-muted-foreground hover:bg-accent hover:text-foreground aria-[current=true]:bg-card aria-[current=true]:font-medium aria-[current=true]:text-foreground aria-[current=true]:shadow-xs"
              >
                {t("pages.nav")}
              </button>
            </li>
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-3">
          {search && <p className="text-sm text-muted-foreground">{t("results", { count: visible.length, q: query.trim() })}</p>}
          {!across && group === "pages" ? (
            <SitePages
              pages={pages.data}
              isLoading={pages.isLoading}
              isError={pages.isError}
              onRetry={pages.refetch}
              onEditOnSite={editOnSite}
            />
          ) : isError ? (
            <QueryError onRetry={refetch} />
          ) : isLoading ? (
            <div className="flex flex-col gap-3 panel p-5">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            !search && onlyChanged && <p className="panel p-6 text-sm text-muted-foreground">{t("noChanges")}</p>
          ) : (
            <div className="flex flex-col divide-y divide-border panel">
              {visible.map((key) => (
                <SiteTextRow
                  key={key}
                  textKey={key}
                  showGroup={across}
                  focused={key === focusKey}
                  defaults={defaults}
                  values={{ de: valueOf("de", key), en: valueOf("en", key) }}
                  stored={{ de: stored.get(textId("de", key)), en: stored.get(textId("en", key)) }}
                  onChange={setDraft}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {dirty && (
        <div
          role="region"
          aria-label={t("unsaved", { count: changes.length })}
          className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 panel px-4 py-3 shadow-lg"
        >
          <p className="text-sm font-medium">{t("unsaved", { count: changes.length })}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setDrafts({})}>
              {t("discard")}
            </Button>
            <Button disabled={busy} onClick={onSave}>
              {busy ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** The about and legal pages: longer content with formatting, edited on the site or in the page editor. */
function SitePages({
  pages,
  isLoading,
  isError,
  onRetry,
  onEditOnSite,
}: {
  pages: AdminPageRow[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onEditOnSite: (path: string) => void;
}) {
  const t = useTranslations("admin.siteTexts.pages");
  const format = useAdminFormat();

  if (isError) return <QueryError onRetry={onRetry} />;
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-muted-foreground">{t("intro")}</p>
      {isLoading ? (
        <div className="flex flex-col gap-3 panel p-5">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : !pages?.length ? (
        <p className="panel p-6 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border panel">
          {pages.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{page.title}</h2>
                  <ContentStatusBadge status={page.status} />
                </div>
                <p className="text-xs text-muted-foreground">/{page.slug}</p>
                <p className="text-xs text-muted-foreground">{t("updated", { date: format.date(page.updatedAt) })}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href={ADMIN_LINKS.page(page.id)}>
                    <Settings2Icon />
                    {t("settings")}
                  </Link>
                </Button>
                {/* Drafts are not on the site yet: they are edited in the page editor. */}
                {page.status === "PUBLISHED" && (
                  <Button size="sm" onClick={() => onEditOnSite(`/${page.slug}`)}>
                    <MousePointerClickIcon />
                    {t("editOnSite")}
                    <ExternalLinkIcon data-icon="inline-end" className="opacity-80" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const rowId = (key: string) => `text-${key.replaceAll(".", "-")}`;

/** One text: German and English side by side, its history on demand. */
function SiteTextRow({
  textKey,
  showGroup,
  focused,
  defaults,
  values,
  stored,
  onChange,
}: {
  textKey: string;
  showGroup: boolean;
  focused: boolean;
  defaults: SiteTextDefaults;
  values: Record<Locale, string>;
  stored: Record<Locale, StoredSiteText | undefined>;
  onChange: (locale: Locale, key: string, value: string) => void;
}) {
  const t = useTranslations("admin.siteTexts");
  const [history, setHistory] = useState(false);

  return (
    <article id={rowId(textKey)} className={cn("flex scroll-mt-24 flex-col gap-3 p-4 sm:p-5", focused && "bg-brand-soft/40")}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 className="text-sm font-semibold" title={textKey}>
            {textLabel(textKey)}
          </h2>
          {showGroup && <p className="text-xs text-muted-foreground">{t(`groups.${groupOf(textKey)}`)}</p>}
        </div>
        <Button type="button" variant="ghost" size="xs" aria-expanded={history} onClick={() => setHistory((open) => !open)}>
          <HistoryIcon />
          {t("history.show")}
        </Button>
      </header>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2">
        {LOCALES.map((locale) => (
          <SiteTextField
            key={locale}
            id={`${rowId(textKey)}-${locale}`}
            locale={locale}
            value={values[locale]}
            original={defaults[locale][textKey]}
            stored={stored[locale]}
            onChange={(value) => onChange(locale, textKey, value)}
          />
        ))}
      </div>
      {history && (
        <SiteTextHistory
          textKey={textKey}
          defaults={{ de: defaults.de[textKey], en: defaults.en[textKey] }}
          onUse={(locale, value) => onChange(locale, textKey, value)}
        />
      )}
    </article>
  );
}
