import { hasMarker, readMarkers, stripMarkers } from "@/lib/siteTexts/markers";
import { isEditableText } from "./siteTexts";

/**
 * Finding site texts in the page for the on-page editor. In edit mode every
 * text carries an invisible marker (src/lib/siteTexts/markers.ts); these read
 * them back from the DOM. The page itself is never changed: which element
 * shows which texts is kept in a map, so React's markup stays as rendered.
 */

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TEXTAREA"]);
const ATTRIBUTES = ["placeholder", "aria-label", "title", "alt"] as const;

/** One text on the page; `element` is null for the document title. */
export interface PageText {
  key: string;
  element: Element | null;
}

export interface PageScan {
  texts: PageText[];
  /** Elements that show texts (as content or in an attribute), with their keys. */
  marks: Map<Element, string[]>;
  /** A page's own content (`data-site-page`, by slug): edited in the page editor, not here. */
  pages: Map<Element, string>;
}

/** What the pointer is on: an element showing site texts, or a page's own content. */
export type EditTarget = { kind: "text"; element: Element } | { kind: "page"; element: Element; slug: string };

const keysOf = (value: string | null | undefined, keys: readonly string[]) =>
  readMarkers(value ?? "")
    .map((index) => keys[index])
    .filter((key): key is string => !!key && isEditableText(key));

function textNodes(ignore: Element | null, keys: readonly string[], match?: string): Text[] {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (node.nodeType !== Node.TEXT_NODE) {
        return SKIP.has(node.nodeName) || node === ignore ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
      }
      if (!hasMarker(node.nodeValue)) return NodeFilter.FILTER_SKIP;
      return !match || keysOf(node.nodeValue, keys)[0] === match ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) nodes.push(node as Text);
  return nodes;
}

/** Every text on the page in page order, and the elements that show them. `ignore` is the editor itself. */
export function scanPage(ignore: Element | null, keys: readonly string[]): PageScan {
  const marks = new Map<Element, string[]>();
  const found = new Map<string, Element | null>();
  const add = (element: Element, shown: string[]) => {
    marks.set(element, [...new Set([...(marks.get(element) ?? []), ...shown])]);
    for (const key of shown) if (!found.has(key)) found.set(key, element);
  };

  for (const node of textNodes(ignore, keys)) {
    const shown = keysOf(node.nodeValue, keys);
    if (node.parentElement && shown.length) add(node.parentElement, shown);
  }
  for (const element of document.body.querySelectorAll(ATTRIBUTES.map((name) => `[${name}]`).join(","))) {
    if (ignore?.contains(element)) continue;
    const shown = ATTRIBUTES.flatMap((name) => keysOf(element.getAttribute(name), keys));
    if (shown.length) add(element, shown);
  }
  for (const key of keysOf(document.title, keys)) if (!found.has(key)) found.set(key, null);

  const pages = new Map<Element, string>();
  for (const element of document.body.querySelectorAll("[data-site-page]")) {
    const slug = element.getAttribute("data-site-page");
    if (slug && !ignore?.contains(element)) pages.set(element, slug);
  }

  return { texts: [...found].map(([key, element]) => ({ key, element })), marks, pages };
}

/** The nearest editable thing from `target` up. */
export function targetAt(target: EventTarget | null, scan: Pick<PageScan, "marks" | "pages">): EditTarget | null {
  for (let element = target instanceof Element ? target : null; element; element = element.parentElement) {
    if (scan.marks.has(element)) return { kind: "text", element };
    const slug = scan.pages.get(element);
    if (slug) return { kind: "page", element, slug };
  }
  return null;
}

/** The text of `element` under the pointer: the exact text node when the browser can tell, else its first text. */
export function textKeyAt(
  event: MouseEvent,
  element: Element,
  keys: readonly string[],
  marks: Map<Element, string[]>,
): string | null {
  const caret =
    document.caretPositionFromPoint?.(event.clientX, event.clientY)?.offsetNode ??
    document.caretRangeFromPoint?.(event.clientX, event.clientY)?.startContainer;
  if (caret?.nodeType === Node.TEXT_NODE && element.contains(caret)) {
    const [key] = keysOf(caret.nodeValue, keys);
    if (key) return key;
  }
  return marks.get(element)?.[0] ?? null;
}

/**
 * The text nodes that show `key` as a whole, for a live preview while typing.
 * A node that shows only part of the text (split into lines, or formatted
 * with values) is left alone.
 */
export function previewNodes(ignore: Element | null, keys: readonly string[], key: string, shown: string) {
  return textNodes(ignore, keys, key)
    .filter((node) => stripMarkers(node.nodeValue ?? "") === shown)
    .map((node) => {
      const original = node.nodeValue ?? "";
      const prefix = original.slice(0, original.length - shown.length);
      return { node, original, show: (text: string) => void (node.nodeValue = prefix + text) };
    });
}

/** Puts an outline box (position: fixed) over `element`, or hides it. */
export function placeBox(box: HTMLElement | null, element: Element | null) {
  if (!box) return;
  const rect = element?.getBoundingClientRect();
  if (!rect || (!rect.width && !rect.height)) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  box.style.top = `${rect.top - 3}px`;
  box.style.left = `${rect.left - 3}px`;
  box.style.width = `${rect.width + 6}px`;
  box.style.height = `${rect.height + 6}px`;
}
