"use client";

import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  Undo2Icon,
  UnlinkIcon,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Product description editor. It only offers what the API keeps when it
 * sanitizes the HTML (paragraphs, headings, lists, emphasis, quotes, links),
 * so what staff see is what the storefront shows.
 */
export function RichTextEditor({
  id,
  value,
  onChange,
  label,
}: {
  id: string;
  value: string;
  onChange: (html: string) => void;
  label: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto"] },
      }),
    ],
    content: value,
    // The admin renders in the browser only, but the hook must not render during hydration.
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        id,
        "aria-label": label,
        class: "rich-text min-h-40 px-3 py-2.5 text-sm leading-6 outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

type ToolKey =
  | "bold"
  | "italic"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "quote"
  | "link"
  | "unlink"
  | "undo"
  | "redo";

function Toolbar({ editor }: { editor: Editor }) {
  const t = useTranslations("admin.product.editor");
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState("");

  const tools: { key: ToolKey; icon: LucideIcon; active?: boolean; run: () => void; disabled?: boolean }[] = [
    { key: "bold", icon: BoldIcon, active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    {
      key: "italic",
      icon: ItalicIcon,
      active: editor.isActive("italic"),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      key: "heading2",
      icon: Heading2Icon,
      active: editor.isActive("heading", { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      key: "heading3",
      icon: Heading3Icon,
      active: editor.isActive("heading", { level: 3 }),
      run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      key: "bulletList",
      icon: ListIcon,
      active: editor.isActive("bulletList"),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      key: "orderedList",
      icon: ListOrderedIcon,
      active: editor.isActive("orderedList"),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      key: "quote",
      icon: QuoteIcon,
      active: editor.isActive("blockquote"),
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    editor.isActive("link")
      ? { key: "unlink", icon: UnlinkIcon, run: () => editor.chain().focus().unsetLink().run() }
      : {
          key: "link",
          icon: LinkIcon,
          active: linking,
          run: () => {
            setHref("");
            setLinking((open) => !open);
          },
        },
    { key: "undo", icon: Undo2Icon, run: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
    { key: "redo", icon: Redo2Icon, run: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
  ];

  const applyLink = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const url = href.trim();
    if (/^(https?:\/\/|mailto:)/i.test(url)) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      setLinking(false);
    }
  };

  return (
    <div className="border-b border-input bg-secondary/60">
      <div role="toolbar" aria-label={t("toolbar")} className="flex flex-wrap gap-0.5 p-1">
        {tools.map(({ key, icon: Icon, active, run, disabled }) => (
          <Button
            key={key}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t(key)}
            aria-pressed={active}
            title={t(key)}
            disabled={disabled}
            onClick={run}
            className={cn(active && "bg-background shadow-xs")}
          >
            <Icon />
          </Button>
        ))}
      </div>
      {linking && (
        // Not a <form>: this sits inside the product form.
        <div className="flex gap-2 border-t border-input p-2">
          <Input
            type="url"
            value={href}
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyLink(event);
              if (event.key === "Escape") setLinking(false);
            }}
            placeholder="https://"
            aria-label={t("linkUrl")}
            autoFocus
            className="h-8 bg-background"
          />
          <Button type="button" size="sm" className="h-8" onClick={applyLink}>
            {t("applyLink")}
          </Button>
        </div>
      )}
    </div>
  );
}
