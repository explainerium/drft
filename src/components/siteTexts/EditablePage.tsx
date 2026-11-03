"use client";

import { EditorContent, type Editor } from "@tiptap/react";
import { ExternalLinkIcon, PencilLineIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { RichTextToolbar, useRichTextEditor } from "@/components/dashboard/products/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_LINKS } from "@/constants/admin";
import { routing, type Locale } from "@/i18n/routing";
import { announceSiteChange } from "@/lib/siteTexts/sync";
import { cn } from "@/lib/utils";
import { revalidateTags } from "@/redux/api/adminCatalogApi";
import {
  useGetAdminPageQuery,
  useGetAdminPagesQuery,
  useUpdatePageMutation,
  type AdminPage,
} from "@/redux/api/adminContentApi";
import { toTranslations } from "@/types/i18n";
import { apiErrorMessage } from "@/utils/apiError";

/** The on-page editor asks a page to switch into editing with this event (detail: the page slug). */
export const EDIT_PAGE_EVENT = "drft:edit-page";

// Editable areas keep the page's own typography; a dashed outline shows where to type.
const EDITABLE =
  "w-full rounded-md bg-transparent outline-2 outline-offset-4 outline-transparent outline-dashed hover:outline-border focus:outline-solid focus:outline-brand";

type Fields = { title: string; intro: string; body: string };

const FIELDS = ["title", "intro", "body"] as const;

/**
 * A page's own content (about, legal pages) while staff edit the site. It shows
 * as usual until the on-page editor asks for it, then turns into an editor in
 * place: the page's own typography, a formatting bar, both languages.
 */
export function EditablePage({ slug, locale, children }: { slug: string; locale: Locale; children: ReactNode }) {
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const open = (event: Event) => {
      if ((event as CustomEvent<string>).detail === slug) setEditing(true);
    };
    window.addEventListener(EDIT_PAGE_EVENT, open);
    return () => window.removeEventListener(EDIT_PAGE_EVENT, open);
  }, [slug]);

  if (!editing) return <div data-site-page={slug}>{children}</div>;
  return <PageLoader slug={slug} locale={locale} onClose={() => setEditing(false)} />;
}

/** The page as stored (both languages) comes from the admin API. */
function PageLoader({ slug, locale, onClose }: { slug: string; locale: Locale; onClose: () => void }) {
  const t = useTranslations("admin.siteTexts.pageEditor");
  const pages = useGetAdminPagesQuery();
  const id = pages.data?.find((page) => page.slug === slug)?.id;
  const page = useGetAdminPageQuery(id ?? "", { skip: !id });

  if (pages.isError || page.isError || (pages.data && !id)) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-md border p-5 text-sm">
        <p>{t("loadFailed")}</p>
        <Button variant="outline" size="sm" onClick={onClose}>
          {t("cancel")}
        </Button>
      </div>
    );
  }
  if (!page.data) {
    return (
      <div aria-busy="true" aria-label={t("loading")} className="flex flex-col gap-5">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return <PageForm key={page.data.id} page={page.data} locale={locale} onClose={onClose} />;
}

const fieldsOf = (page: AdminPage): Record<Locale, Fields> => {
  const en = page.translations?.en;
  return {
    de: { title: page.title, intro: page.intro ?? "", body: page.body ?? "" },
    en: { title: en?.title ?? "", intro: en?.intro ?? "", body: en?.body ?? "" },
  };
};

function PageForm({ page, locale, onClose }: { page: AdminPage; locale: Locale; onClose: () => void }) {
  const t = useTranslations("admin.siteTexts");
  const router = useRouter();
  const [update] = useUpdatePageMutation();
  const [initial] = useState(() => fieldsOf(page));
  const [values, setValues] = useState(initial);
  const [language, setLanguage] = useState<Locale>(locale);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const current = values[language];
  const german = values.de;
  const titleMissing = !german.title.trim();
  const dirty = routing.locales.some((l) => FIELDS.some((field) => values[l][field] !== initial[l][field]));

  // After saving, close once the refreshed page is there, so the old text never flashes back.
  useEffect(() => {
    if (saved && !refreshing) onClose();
  }, [saved, refreshing, onClose]);

  // Unsaved edits: ask before the tab closes or reloads.
  useEffect(() => {
    if (!dirty || saved) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saved]);

  const set = (field: keyof Fields, value: string) =>
    setValues((all) => ({ ...all, [language]: { ...all[language], [field]: value } }));

  const save = async () => {
    if (titleMissing) {
      setLanguage("de");
      return;
    }
    setBusy(true);
    const en = page.translations?.en;
    try {
      await update({
        id: page.id,
        body: {
          title: german.title.trim(),
          intro: german.intro.trim() || null,
          body: german.body || null,
          // The search engine texts are kept as they are; this editor does not show them.
          translations: toTranslations({
            title: values.en.title,
            intro: values.en.intro,
            body: values.en.body,
            metaTitle: en?.metaTitle ?? "",
            metaDescription: en?.metaDescription ?? "",
          }),
        },
      }).unwrap();
    } catch (error) {
      setBusy(false);
      toast.error(apiErrorMessage(error) ?? t("pageEditor.failed"));
      return;
    }
    toast.success(t("pageEditor.saved"));
    await revalidateTags(["pages", `page:${page.slug}`]);
    announceSiteChange("pages");
    startRefresh(() => router.refresh());
    setSaved(true);
  };

  return (
    <div data-site-editor="" className="flex flex-col">
      <div
        role="toolbar"
        aria-label={t("pageEditor.title")}
        className="admin sticky top-18 z-30 mb-8 flex flex-wrap items-center gap-2 panel p-2 font-sans text-foreground shadow-md lg:top-21"
      >
        <span className="flex items-center gap-1.5 px-1.5 text-sm font-semibold">
          <PencilLineIcon className="size-4 text-primary" />
          {t("pageEditor.title")}
        </span>
        <div role="group" aria-label={t("pageEditor.language")} className="flex rounded-lg bg-muted p-0.5">
          {routing.locales.map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={language === l}
              onClick={() => setLanguage(l)}
              className="h-7 rounded-md px-2.5 text-sm text-muted-foreground aria-pressed:bg-card aria-pressed:font-medium aria-pressed:text-foreground aria-pressed:shadow-xs"
            >
              {t(`languages.${l}`)}
            </button>
          ))}
        </div>
        {editor && <RichTextToolbar editor={editor} className="border-0 bg-transparent" />}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {confirming ? (
            <>
              <span className="px-1 text-sm">{t("pageEditor.discardQuestion")}</span>
              <Button variant="outline" size="sm" onClick={() => setConfirming(false)}>
                {t("pageEditor.keepEditing")}
              </Button>
              <Button variant="destructive" size="sm" onClick={onClose}>
                {t("pageEditor.discard")}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <a href={ADMIN_LINKS.page(page.id)} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon />
                  {t("pageEditor.moreSettings")}
                </a>
              </Button>
              <Button variant="outline" size="sm" disabled={busy} onClick={() => (dirty ? setConfirming(true) : onClose())}>
                {t("pageEditor.cancel")}
              </Button>
              <Button size="sm" disabled={busy || !dirty} onClick={save}>
                {busy ? t("pageEditor.saving") : t("pageEditor.save")}
              </Button>
            </>
          )}
        </div>
      </div>

      {language !== routing.defaultLocale && (
        <p className="mb-4 text-sm text-muted-foreground">{t("pageEditor.fallback")}</p>
      )}

      <textarea
        aria-label={t("pageEditor.titleLabel")}
        lang={language}
        rows={1}
        maxLength={160}
        value={current.title}
        placeholder={language === "de" ? undefined : german.title}
        aria-invalid={language === "de" && titleMissing}
        // A title is one line: line breaks become spaces.
        onChange={(event) => set("title", event.target.value.replace(/\s*\n\s*/g, " "))}
        className={cn(
          EDITABLE,
          "field-sizing-content resize-none overflow-hidden font-heading text-4xl leading-tight font-medium tracking-[-0.025em] placeholder:text-muted-foreground/50 md:text-5xl md:leading-[56px]",
        )}
      />
      {language === "de" && titleMissing && (
        <p className="mt-2 text-sm font-medium text-destructive">{t("pageEditor.titleRequired")}</p>
      )}
      <textarea
        aria-label={t("pageEditor.introLabel")}
        lang={language}
        rows={1}
        maxLength={600}
        value={current.intro}
        placeholder={(language === "de" ? "" : german.intro) || t("pageEditor.introPlaceholder")}
        onChange={(event) => set("intro", event.target.value)}
        className={cn(
          EDITABLE,
          "mt-5 field-sizing-content resize-none overflow-hidden text-lg leading-8 text-muted-foreground placeholder:text-muted-foreground/50",
        )}
      />
      <div className="mt-10 border-t pt-10">
        <BodyEditor
          key={language}
          id={`page-body-${language}`}
          label={t("pageEditor.bodyLabel")}
          value={current.body}
          onChange={(html) => set("body", html)}
          onEditor={setEditor}
        />
      </div>
    </div>
  );
}

/** The page text of one language, in the page's own type; its formatting bar sits in the bar above. */
function BodyEditor({
  id,
  label,
  value,
  onChange,
  onEditor,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (html: string) => void;
  onEditor: (editor: Editor | null) => void;
}) {
  const editor = useRichTextEditor({
    id,
    label,
    value,
    onChange,
    className: cn(
      EDITABLE,
      "rich-text min-h-40 text-base leading-7 text-muted-foreground [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:mt-8",
    ),
  });

  useEffect(() => {
    onEditor(editor);
    return () => onEditor(null);
  }, [editor, onEditor]);

  return <EditorContent editor={editor} />;
}
