"use client";

import { ExternalLinkIcon, ListIcon, PencilLineIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ADMIN_LINKS } from "@/constants/admin";
import { STAFF_ROLES } from "@/constants/auth";
import { routing, type Locale } from "@/i18n/routing";
import { announceSiteChange, useSiteChanges } from "@/lib/siteTexts/sync";
import { cn } from "@/lib/utils";
import { revalidateTags } from "@/redux/api/adminCatalogApi";
import { useGetAdminPagesQuery } from "@/redux/api/adminContentApi";
import { useSession } from "@/redux/api/authApi";
import { baseApi } from "@/redux/api/baseApi";
import {
  useGetStoredSiteTextsQuery,
  useSaveSiteTextsMutation,
  type SiteTextChange,
  type StoredSiteText,
} from "@/redux/api/siteTextsApi";
import { useAppDispatch } from "@/redux/hooks";
import { apiErrorMessage } from "@/utils/apiError";
import { EDIT_PAGE_EVENT } from "./EditablePage";
import { placeBox, previewNodes, scanPage, targetAt, textKeyAt, type PageScan, type PageText } from "./pageTexts";
import { SiteTextField } from "./SiteTextField";
import { SiteTextHistory } from "./SiteTextHistory";
import {
  changeOf,
  groupOf,
  issueOf,
  storedById,
  textId,
  textLabel,
  type SiteTextDefaults,
} from "./siteTexts";
import { stopTextEditing } from "./useTextEditing";

const BOX = "pointer-events-none fixed z-[69] rounded-md";

/** Asks a page's own content (about, legal pages) to turn into its in-place editor. */
const editPage = (slug: string) => window.dispatchEvent(new CustomEvent(EDIT_PAGE_EVENT, { detail: slug }));

// The in-place page editor changes the DOM on every keystroke; the scan has nothing to find there.
const inEditor = (node: Node) => !!(node instanceof Element ? node : node.parentElement)?.closest("[data-site-editor]");

/**
 * The on-page text editor, shown to staff in edit mode (see
 * /api/internal/edit-texts). Each text on the page carries an invisible
 * marker; hovering outlines it, clicking opens it in a side panel with both
 * languages. A page's own content (about, legal pages) turns into an editor
 * right where it is. Browse mode lets links and buttons work again. The editor
 * never touches the page's markup: outlines are boxes of its own on top.
 */
export function TextEditMode({
  keys,
  defaults,
  locale,
}: {
  keys: string[];
  defaults: SiteTextDefaults;
  locale: Locale;
}) {
  const t = useTranslations("admin.siteTexts");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const rootRef = useRef<HTMLDivElement>(null);
  const hoverBox = useRef<HTMLDivElement>(null);
  const activeBox = useRef<HTMLDivElement>(null);
  const scanned = useRef<PageScan>({ texts: [], marks: new Map(), pages: new Map() });
  const { user, isLoading: sessionLoading } = useSession();
  const isStaff = !!user && (STAFF_ROLES as readonly string[]).includes(user.role);
  const [mode, setMode] = useState<"edit" | "browse">("edit");
  const [texts, setTexts] = useState<PageText[]>([]);
  const [pages, setPages] = useState<{ slug: string; element: Element }[]>([]);
  const [hoverPage, setHoverPage] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState<PageText | null>(null);
  const editing = isStaff && mode === "edit";

  // Saved in the dashboard (another tab): show it here as well.
  useSiteChanges((change) => {
    dispatch(baseApi.util.invalidateTags(change === "texts" ? ["SiteText"] : ["ContentPage"]));
    router.refresh();
  });
  const { data: adminPages } = useGetAdminPagesQuery(undefined, { skip: !isStaff });
  const pageTitle = (slug: string) => adminPages?.find((page) => page.slug === slug)?.title ?? `/${slug}`;

  // Find the texts now and whenever the page changes (not the editor's own updates).
  useEffect(() => {
    let frame = 0;
    const scan = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = scanPage(rootRef.current, keys);
        scanned.current = next;
        setTexts((current) =>
          current.length === next.texts.length &&
          current.every((text, i) => text.key === next.texts[i].key && text.element === next.texts[i].element)
            ? current
            : next.texts,
        );
        const found = [...next.pages].map(([element, slug]) => ({ slug, element }));
        setPages((current) =>
          current.length === found.length && current.every((page, i) => page.element === found[i].element)
            ? current
            : found,
        );
      });
    };
    scan();
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => !rootRef.current?.contains(mutation.target) && !inEditor(mutation.target))) scan();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [keys]);

  // Edit mode: outline the text under the pointer; a click opens it instead of following a link or button.
  useEffect(() => {
    if (!editing) return;
    const box = hoverBox.current;
    let hovered: Element | null = null;
    const outside = (event: Event) => !rootRef.current?.contains(event.target as Node);

    const hover = (event: PointerEvent) => {
      const target = outside(event) ? targetAt(event.target, scanned.current) : null;
      if ((target?.element ?? null) === hovered) return;
      hovered = target?.element ?? null;
      placeBox(box, hovered);
      setHoverPage(target?.kind === "page" ? target.slug : null);
    };
    const follow = () => placeBox(box, hovered);
    const intercept = (event: MouseEvent) => {
      if (!outside(event)) return;
      const target = targetAt(event.target, scanned.current);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      if (event.type !== "click") return;
      if (target.kind === "page") {
        hovered = null;
        placeBox(box, null);
        setHoverPage(null);
        editPage(target.slug);
        return;
      }
      const key = textKeyAt(event, target.element, keys, scanned.current.marks);
      if (key) setActive({ key, element: target.element });
    };

    const types = ["pointerdown", "mousedown", "click"] as const;
    window.addEventListener("pointermove", hover, { passive: true });
    window.addEventListener("scroll", follow, { passive: true, capture: true });
    for (const type of types) window.addEventListener(type, intercept, true);
    return () => {
      placeBox(box, null);
      setHoverPage(null);
      window.removeEventListener("pointermove", hover);
      window.removeEventListener("scroll", follow, { capture: true });
      for (const type of types) window.removeEventListener(type, intercept, true);
    };
  }, [editing, keys]);

  // The text being edited stays outlined, also while it scrolls or changes size.
  useEffect(() => {
    const box = activeBox.current;
    const element = active?.element ?? null;
    const follow = () => placeBox(box, element);
    follow();
    if (!element) return;
    const resize = new ResizeObserver(follow);
    resize.observe(element);
    window.addEventListener("scroll", follow, { passive: true, capture: true });
    window.addEventListener("resize", follow);
    return () => {
      placeBox(box, null);
      resize.disconnect();
      window.removeEventListener("scroll", follow, { capture: true });
      window.removeEventListener("resize", follow);
    };
  }, [active]);

  useEffect(() => {
    if (!listOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setListOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [listOpen]);

  const open = (text: PageText) => {
    setListOpen(false);
    setActive(text);
    if (text.element?.getClientRects().length) text.element.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div ref={rootRef} lang="en" className="admin" data-site-text-editor="">
      <div ref={hoverBox} hidden className={cn(BOX, "outline-2 outline-brand-bright")}>
        {hoverPage && (
          <span className="absolute bottom-full left-0 mb-1.5 rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow-sm">
            {t("editor.editPage")}
          </span>
        )}
      </div>
      <div ref={activeBox} hidden className={cn(BOX, "outline-2 outline-primary")} />

      <div
        role="toolbar"
        aria-label={t("editor.title")}
        className={cn(
          "fixed bottom-4 left-4 z-[70] flex max-w-[calc(100vw-2rem)] flex-wrap items-center gap-1.5 panel p-1.5 font-sans text-foreground shadow-lg",
          active && "max-md:hidden",
        )}
      >
        <span className="flex items-center gap-1.5 px-2 text-sm font-semibold">
          <PencilLineIcon className="size-4 text-primary" />
          {t("editor.title")}
        </span>

        {sessionLoading ? null : !isStaff ? (
          <span className="px-2 text-sm text-muted-foreground">{t("editor.staffOnly")}</span>
        ) : (
          <>
            <div role="group" aria-label={t("editor.mode")} className="flex rounded-lg bg-muted p-0.5">
              {(["edit", "browse"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => setMode(value)}
                  className="h-7 rounded-md px-2.5 text-sm text-muted-foreground aria-pressed:bg-card aria-pressed:font-medium aria-pressed:text-foreground aria-pressed:shadow-xs"
                >
                  {t(`editor.${value}`)}
                </button>
              ))}
            </div>
            <div className="relative">
              <Button variant="ghost" size="sm" aria-expanded={listOpen} onClick={() => setListOpen((value) => !value)}>
                <ListIcon />
                {t("editor.onPage", { count: texts.length + pages.length })}
              </Button>
              {listOpen && (
                <PageTextList
                  texts={texts}
                  pages={pages.map(({ slug }) => ({ slug, title: pageTitle(slug) }))}
                  defaults={defaults}
                  locale={locale}
                  onOpen={open}
                  onOpenPage={(slug) => {
                    setListOpen(false);
                    pages.find((page) => page.slug === slug)?.element.scrollIntoView({ block: "start", behavior: "smooth" });
                    editPage(slug);
                  }}
                />
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href={ADMIN_LINKS.siteTexts} target="_blank" rel="noreferrer">
                <ExternalLinkIcon />
                {t("editor.allTexts")}
              </a>
            </Button>
          </>
        )}
        <Button size="sm" onClick={stopTextEditing}>
          {t("editor.done")}
        </Button>
      </div>

      {editing && !active && (
        <p className="sr-only" role="status">
          {t("editor.hint")}
        </p>
      )}

      {isStaff && active && (
        <TextPanel
          key={active.key}
          textKey={active.key}
          keys={keys}
          defaults={defaults}
          locale={locale}
          ignore={rootRef}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

/** The page's own content (edited in place), then every text found on the page, hidden ones included. */
function PageTextList({
  texts,
  pages,
  defaults,
  locale,
  onOpen,
  onOpenPage,
}: {
  texts: PageText[];
  pages: { slug: string; title: string }[];
  defaults: SiteTextDefaults;
  locale: Locale;
  onOpen: (text: PageText) => void;
  onOpenPage: (slug: string) => void;
}) {
  const t = useTranslations("admin.siteTexts");
  const { data } = useGetStoredSiteTextsQuery();
  const stored = storedById(data);

  return (
    <div className="absolute bottom-full left-0 mb-2 flex max-h-[60vh] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-y-auto panel p-1 shadow-lg">
      <p className="px-2.5 pt-2 pb-1 text-xs text-muted-foreground">{t("editor.hint")}</p>
      <ul className="flex flex-col">
        {pages.map((page) => (
          <li key={`page:${page.slug}`}>
            <button
              type="button"
              onClick={() => onOpenPage(page.slug)}
              className="flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-accent"
            >
              <span className="text-xs text-muted-foreground">{t("editor.pageContent")}</span>
              <span className="flex items-center gap-1.5 text-sm">
                <PencilLineIcon className="size-3.5 text-muted-foreground" />
                {page.title}
              </span>
            </button>
          </li>
        ))}
        {texts.map((text) => {
          const visible = !!text.element && text.element.getClientRects().length > 0;
          return (
            <li key={text.key}>
              <button
                type="button"
                onClick={() => onOpen(text)}
                className="flex w-full flex-col gap-0.5 rounded-md px-2.5 py-2 text-left hover:bg-accent"
              >
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {t(`groups.${groupOf(text.key)}`)} › {textLabel(text.key)}
                  {!visible && (
                    <span className="rounded-md bg-muted px-1.5 text-[11px]">
                      {text.element ? t("editor.hidden") : t("editor.pageTitle")}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2 text-sm whitespace-pre-line">
                  {stored.get(textId(locale, text.key))?.value ?? defaults[locale][text.key]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** One text in both languages, the page's language first. Typing previews it on the page where possible. */
function TextPanel({
  textKey,
  keys,
  defaults,
  locale,
  ignore,
  onClose,
}: {
  textKey: string;
  keys: string[];
  defaults: SiteTextDefaults;
  locale: Locale;
  ignore: React.RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const t = useTranslations("admin.siteTexts");
  const router = useRouter();
  const { data } = useGetStoredSiteTextsQuery();
  const [save, saving] = useSaveSiteTextsMutation();
  const stored = storedById(data);
  const storedOf = (l: Locale): StoredSiteText | undefined => stored.get(textId(l, textKey));
  const currentOf = (l: Locale) => storedOf(l)?.value ?? defaults[l][textKey];

  const [drafts, setDrafts] = useState<Partial<Record<Locale, string>>>({});
  const valueOf = (l: Locale) => drafts[l] ?? currentOf(l);
  const languages = [locale, ...routing.locales.filter((l) => l !== locale)];

  // Live preview in the page's language, for plain texts shown whole: found on the first keystroke,
  // put back when the panel closes without saving.
  const preview = useRef<ReturnType<typeof previewNodes> | null>(null);
  useEffect(() => {
    const nodes = preview;
    return () => {
      for (const { node, original } of nodes.current ?? []) if (node.isConnected) node.nodeValue = original;
    };
  }, []);

  const setDraft = (l: Locale, value: string) => {
    setDrafts((current) => ({ ...current, [l]: value }));
    if (l !== locale) return;
    if (!preview.current) {
      const shown = currentOf(locale);
      preview.current = /[{}<>]/.test(shown) ? [] : previewNodes(ignore.current, keys, textKey, shown);
    }
    if (/[{}<>]/.test(value)) return;
    for (const { show } of preview.current) show(value.trim() || defaults[locale][textKey]);
  };

  const changes = routing.locales.flatMap((l): SiteTextChange[] => {
    const next = changeOf(valueOf(l), defaults[l][textKey]);
    return next === (storedOf(l)?.value ?? "") ? [] : [{ key: textKey, locale: l, value: next }];
  });
  const invalid = changes.some((change) => issueOf(change.value, defaults[change.locale][textKey]));

  const onSave = async () => {
    try {
      await save(changes).unwrap();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
      return;
    }
    toast.success(t("saved", { count: changes.length }));
    // Keep the preview on screen until the refresh brings the saved text in its place.
    preview.current = [];
    onClose();
    await revalidateTags(["site-texts"]);
    announceSiteChange("texts");
    router.refresh();
  };

  return (
    <section
      aria-label={textLabel(textKey)}
      className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[75vh] flex-col bg-card font-sans text-foreground shadow-2xl md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:border-l md:border-border"
    >
      <header className="flex items-start justify-between gap-3 border-b border-border p-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-xs text-muted-foreground">{t(`groups.${groupOf(textKey)}`)}</p>
          <h2 className="text-base font-semibold">{textLabel(textKey)}</h2>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label={t("editor.close")} onClick={onClose}>
          <XIcon />
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
        {languages.map((l, i) => (
          <SiteTextField
            key={l}
            id={`site-text-${l}`}
            locale={l}
            value={valueOf(l)}
            original={defaults[l][textKey]}
            stored={storedOf(l)}
            autoFocus={i === 0}
            onChange={(value) => setDraft(l, value)}
          />
        ))}
        <SiteTextHistory
          textKey={textKey}
          defaults={{ de: defaults.de[textKey], en: defaults.en[textKey] }}
          onUse={setDraft}
        />
        <a
          href={ADMIN_LINKS.siteText(textKey)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLinkIcon className="size-3.5" />
          {t("editor.openInList")}
        </a>
      </div>

      <footer className="flex justify-end gap-2 border-t border-border p-4">
        <Button variant="outline" onClick={onClose}>
          {t("editor.cancel")}
        </Button>
        <Button disabled={!changes.length || invalid || saving.isLoading} onClick={onSave}>
          {saving.isLoading ? t("saving") : t("editor.save")}
        </Button>
      </footer>
    </section>
  );
}
