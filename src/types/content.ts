import type { CatalogImage } from "./catalog";

/** Shapes returned by the content endpoints (`/posts`, `/pages`, `/faq`). Bodies are sanitized HTML. */

export interface PostCard {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  tag: string | null;
  author: string | null;
  readMinutes: number;
  publishedAt: string;
  cover: CatalogImage | null;
}

export interface Post extends PostCard {
  body: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
  /** Three more recent posts to read next. */
  more: PostCard[];
}

export interface ContentPage {
  slug: string;
  title: string;
  intro: string | null;
  body: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  updatedAt: string;
}

export interface FaqGroup {
  group: string | null;
  items: { id: string; question: string; answer: string }[];
}

export interface PublicSettings {
  store: { name: string; email: string; phone: string; address: string };
  social: { instagram?: string; youtube?: string; facebook?: string; tiktok?: string };
  seo: { defaultTitle: string; titleTemplate: string; defaultDescription: string; ogImageUrl: string | null };
}
