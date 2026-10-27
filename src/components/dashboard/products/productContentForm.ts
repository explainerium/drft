import { z } from "zod";
import type { AdminProduct, ProductContentInput } from "@/types/adminCatalog";

/**
 * The product page's editorial blocks as form values (strings, empty means
 * none). A block left completely empty is not shown on the product page; a
 * started block needs its required fields, the same rules the API applies.
 */

type Translate = (key: string) => string;

export const STORY_LIMITS = { paragraphs: 4, stats: 4 };
export const FEATURE_LIMIT = 6;

export const contentFormSchema = (t: Translate) => {
  const text = (max: number) => z.string().trim().max(max, t("errors.tooLong"));
  return z.object({
    profile: text(60),
    highlightTitle: text(120),
    highlightBody: text(400),
    story: z.object({
      eyebrow: text(80),
      title: text(160),
      paragraphs: z.array(z.object({ text: text(1200) })).max(STORY_LIMITS.paragraphs),
      stats: z.array(z.object({ value: text(16), label: text(60) })).max(STORY_LIMITS.stats),
      quoteLabel: text(80),
      quoteText: text(300),
      quoteAuthor: text(120),
      imageAssetId: z.string(),
      imageUrl: z.string(),
    }),
    features: z.object({
      eyebrow: text(80),
      title: text(160),
      intro: text(400),
      items: z
        .array(
          z.object({
            label: text(60),
            title: text(80),
            body: text(500),
            footnote: text(60),
            footnoteValue: text(60),
          }),
        )
        .max(FEATURE_LIMIT),
    }),
    // One item per line.
    inTheBox: z
      .string()
      .refine((v) => lines(v).length <= 12, t("content.errors.boxTooMany"))
      .refine((v) => lines(v).every((line) => line.length <= 160), t("errors.tooLong")),
  });
};

export type ContentFormValues = z.infer<ReturnType<typeof contentFormSchema>>;

const lines = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const filled = (...values: string[]) => values.some((v) => v.trim() !== "");

export const EMPTY_CONTENT: ContentFormValues = {
  profile: "",
  highlightTitle: "",
  highlightBody: "",
  story: {
    eyebrow: "",
    title: "",
    paragraphs: [],
    stats: [],
    quoteLabel: "",
    quoteText: "",
    quoteAuthor: "",
    imageAssetId: "",
    imageUrl: "",
  },
  features: { eyebrow: "", title: "", intro: "", items: [] },
  inTheBox: "",
};

export function toContentForm(product: AdminProduct): ContentFormValues {
  const content = product.content ?? {};
  const { story, features } = content;
  return {
    profile: content.profile ?? "",
    highlightTitle: content.highlight?.title ?? "",
    highlightBody: content.highlight?.body ?? "",
    story: {
      eyebrow: story?.eyebrow ?? "",
      title: story?.title ?? "",
      paragraphs: (story?.paragraphs ?? []).map((text) => ({ text })),
      stats: story?.stats ?? [],
      quoteLabel: story?.quote?.label ?? "",
      quoteText: story?.quote?.text ?? "",
      quoteAuthor: story?.quote?.author ?? "",
      imageAssetId: story?.imageAssetId ?? "",
      imageUrl: product.storyImage ? (product.storyImage.sizes.thumb?.url ?? product.storyImage.url) : "",
    },
    features: {
      eyebrow: features?.eyebrow ?? "",
      title: features?.title ?? "",
      intro: features?.intro ?? "",
      items: (features?.items ?? []).map((item) => ({
        label: item.label,
        title: item.title,
        body: item.body,
        footnote: item.footnote ?? "",
        footnoteValue: item.footnoteValue ?? "",
      })),
    },
    inTheBox: (content.inTheBox ?? []).join("\n"),
  };
}

/** Required fields of the blocks that were started. Paths are relative to `content`. */
export function contentIssues(form: ContentFormValues, t: Translate): { path: (string | number)[]; message: string }[] {
  const issues: { path: (string | number)[]; message: string }[] = [];
  const required = (value: string, path: (string | number)[]) => {
    if (!value.trim()) issues.push({ path, message: t("errors.required") });
  };

  if (filled(form.highlightTitle, form.highlightBody)) {
    required(form.highlightTitle, ["highlightTitle"]);
    required(form.highlightBody, ["highlightBody"]);
  }

  const s = form.story;
  const paragraphs = s.paragraphs.filter((p) => p.text.trim());
  const storyStarted =
    filled(s.eyebrow, s.title, s.quoteLabel, s.quoteText, s.quoteAuthor, s.imageAssetId) ||
    paragraphs.length > 0 ||
    s.stats.some((stat) => filled(stat.value, stat.label));
  if (storyStarted) {
    required(s.eyebrow, ["story", "eyebrow"]);
    required(s.title, ["story", "title"]);
    if (paragraphs.length === 0) issues.push({ path: ["story", "paragraphs"], message: t("content.errors.paragraph") });
    s.stats.forEach((stat, i) => {
      if (filled(stat.value, stat.label)) {
        required(stat.value, ["story", "stats", i, "value"]);
        required(stat.label, ["story", "stats", i, "label"]);
      }
    });
    if (filled(s.quoteLabel, s.quoteText, s.quoteAuthor)) {
      required(s.quoteText, ["story", "quoteText"]);
      required(s.quoteAuthor, ["story", "quoteAuthor"]);
    }
  }

  const f = form.features;
  const items = f.items.filter((item) => filled(item.label, item.title, item.body, item.footnote, item.footnoteValue));
  if (filled(f.eyebrow, f.title, f.intro) || items.length > 0) {
    required(f.eyebrow, ["features", "eyebrow"]);
    required(f.title, ["features", "title"]);
    if (items.length === 0) issues.push({ path: ["features", "items"], message: t("content.errors.feature") });
    f.items.forEach((item, i) => {
      if (filled(item.label, item.title, item.body, item.footnote, item.footnoteValue)) {
        required(item.label, ["features", "items", i, "label"]);
        required(item.title, ["features", "items", i, "title"]);
        required(item.body, ["features", "items", i, "body"]);
      }
    });
  }
  return issues;
}

const opt = (value: string) => (value.trim() ? value.trim() : undefined);

/** Form values as the stored JSON; null when every block is empty. */
export function toContentInput(form: ContentFormValues): ProductContentInput | null {
  const content: ProductContentInput = {};
  if (opt(form.profile)) content.profile = form.profile.trim();
  if (filled(form.highlightTitle, form.highlightBody)) {
    content.highlight = { title: form.highlightTitle.trim(), body: form.highlightBody.trim() };
  }

  const s = form.story;
  const paragraphs = s.paragraphs.map((p) => p.text.trim()).filter(Boolean);
  if (filled(s.eyebrow, s.title) || paragraphs.length) {
    content.story = {
      eyebrow: s.eyebrow.trim(),
      title: s.title.trim(),
      paragraphs,
      stats: s.stats
        .filter((stat) => filled(stat.value, stat.label))
        .map((stat) => ({ value: stat.value.trim(), label: stat.label.trim() })),
      ...(filled(s.quoteText, s.quoteAuthor)
        ? { quote: { label: opt(s.quoteLabel), text: s.quoteText.trim(), author: s.quoteAuthor.trim() } }
        : {}),
      ...(s.imageAssetId ? { imageAssetId: s.imageAssetId } : {}),
    };
  }

  const f = form.features;
  const items = f.items.filter((item) => filled(item.label, item.title, item.body));
  if (filled(f.eyebrow, f.title) || items.length) {
    content.features = {
      eyebrow: f.eyebrow.trim(),
      title: f.title.trim(),
      intro: opt(f.intro),
      items: items.map((item) => ({
        label: item.label.trim(),
        title: item.title.trim(),
        body: item.body.trim(),
        footnote: opt(item.footnote),
        footnoteValue: opt(item.footnoteValue),
      })),
    };
  }

  const box = lines(form.inTheBox);
  if (box.length) content.inTheBox = box;
  return Object.keys(content).length ? content : null;
}
