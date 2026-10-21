import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Reassurance } from "@/components/shop/Reassurance";
import { ShopView, ShopViewSkeleton } from "@/components/shop/ShopView";
import { findCategory, getCategoryTree } from "@/lib/catalog";

type Props = PageProps<"/[locale]/shop/[category]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const [t, tree] = await Promise.all([getTranslations("shop"), getCategoryTree()]);
  const category = findCategory(tree, slug)?.category;
  if (!category) return {};
  return {
    title: category.metaTitle ?? category.name,
    description:
      category.metaDescription ?? category.description ?? t("categoryDescription", { name: category.name }),
    // Without a category image the store-wide OG image from the layout applies.
    openGraph: category.image
      ? { images: [{ url: category.image.sizes.large?.url ?? category.image.url, alt: category.image.alt ?? category.name }] }
      : undefined,
  };
}

// No generateStaticParams: categories are managed in the admin, so every
// category page renders on request (its data is cached in lib/catalog).
async function Results({ params, searchParams }: Props) {
  const [{ category }, query] = await Promise.all([params, searchParams]);
  return <ShopView categorySlug={category} searchParams={query} />;
}

export default function CategoryPage({ params, searchParams }: Props) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ShopViewSkeleton />}>
        <Results params={params} searchParams={searchParams} />
      </Suspense>
      <Reassurance />
    </main>
  );
}
