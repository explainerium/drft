import { parse, TYPE, type MessageFormatElement } from "@formatjs/icu-messageformat-parser";

/**
 * Checks an edited site text against the text it replaces, so an edit can never
 * break a page. Texts use ICU syntax: `{name}` is a value the page fills in,
 * `{count, plural, …}` picks wording by number, `<link>…</link>` wraps part of
 * the text in an element. An edit may reword freely and may leave values or
 * tags out, but it may only use the values and tags the original has, each the
 * same way (or as a plain `{name}`).
 */

export type TextIssue =
  | { kind: "syntax" }
  | { kind: "unknownValue"; name: string }
  | { kind: "unknownTag"; name: string }
  | { kind: "valueUse"; name: string };

export interface TextCheck {
  issue: TextIssue | null;
  /** Values and tags of the original that the edit leaves out: allowed, worth a word. */
  dropped: string[];
}

interface Shape {
  values: Map<string, Set<TYPE>>;
  tags: Set<string>;
}

function shapeOf(elements: MessageFormatElement[], shape: Shape = { values: new Map(), tags: new Set() }): Shape {
  for (const element of elements) {
    switch (element.type) {
      case TYPE.argument:
      case TYPE.number:
      case TYPE.date:
      case TYPE.time:
      case TYPE.select:
      case TYPE.plural:
        shape.values.set(element.value, (shape.values.get(element.value) ?? new Set()).add(element.type));
        if (element.type === TYPE.select || element.type === TYPE.plural) {
          for (const option of Object.values(element.options)) shapeOf(option.value, shape);
        }
        break;
      case TYPE.tag:
        shape.tags.add(element.value);
        shapeOf(element.children, shape);
        break;
    }
  }
  return shape;
}

function parseShape(text: string): Shape | null {
  try {
    return shapeOf(parse(text));
  } catch {
    return null;
  }
}

/** The values and tags a text uses, as written in it: `{count}`, `<link>`. */
export function placeholdersOf(text: string): string[] {
  const shape = parseShape(text);
  if (!shape) return [];
  return [...[...shape.values.keys()].map((name) => `{${name}}`), ...[...shape.tags].map((name) => `<${name}>`)];
}

export function checkText(text: string, original: string): TextCheck {
  const edited = parseShape(text);
  if (!edited) return { issue: { kind: "syntax" }, dropped: [] };
  const base = parseShape(original) ?? { values: new Map(), tags: new Set<string>() };

  for (const [name, uses] of edited.values) {
    const allowed = base.values.get(name);
    if (!allowed) return { issue: { kind: "unknownValue", name }, dropped: [] };
    for (const use of uses) {
      if (use !== TYPE.argument && !allowed.has(use)) return { issue: { kind: "valueUse", name }, dropped: [] };
    }
  }
  for (const name of edited.tags) {
    if (!base.tags.has(name)) return { issue: { kind: "unknownTag", name }, dropped: [] };
  }

  return {
    issue: null,
    dropped: [
      ...[...base.values.keys()].filter((name) => !edited.values.has(name)).map((name) => `{${name}}`),
      ...[...base.tags].filter((name) => !edited.tags.has(name)).map((name) => `<${name}>`),
    ],
  };
}
