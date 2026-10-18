import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Fragment, Suspense } from "react";
import { ProductFeatures } from "@/components/product/ProductFeatures";
import { ProductHero } from "@/components/product/ProductHero";
import { ProductSpecs } from "@/components/product/ProductSpecs";
import { ProductStory } from "@/components/product/ProductStory";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { Link } from "@/i18n/navigation";
import { findCategory, getCategoryTree, getProduct } from "@/lib/catalog";
import type { ProductDetail } from "@/types/catalog";

type Props = PageProps<"/[locale]/products/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};
  const image = product.featuredImage ?? product.images[0];
  return {
    title: product.metaTitle ?? product.name,
    description: product.metaDescription ?? product.shortDescription ?? undefined,
    openGraph: image ? { images: [{ url: image.sizes.large?.url ?? image.url }] } : undefined,
  };
}

/** schema.org Product, so search engines can show price and availability. */
function productJsonLd(product: ProductDetail) {
  const prices = product.variants.map((v) => Number(v.price));
  const image = product.featuredImage ?? product.images[0];
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? undefined,
    image: image ? [image.url] : undefined,
    sku: product.variants.find((v) => v.isDefault)?.sku ?? undefined,
    brand: { "@type": "Brand", name: "DRFT" },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "EUR",
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: product.variants.length,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

async function ProductPage({ params }: { params: Props["params"] }) {
  const { slug } = await params;
  const [product, tree, t] = await Promise.all([getProduct(slug), getCategoryTree(), getTranslations("product")]);
  if (!product) notFound();

  // Breadcrumb through the deepest category the product is in.
  const trail = product.categories
    .map((c) => findCategory(tree, c.slug))
    .filter((found) => found !== null)
    .sort((a, b) => b.ancestors.length - a.ancestors.length)[0];
  const crumbs = trail ? [...trail.ancestors, trail.category] : [];

  const breadcrumb = (
    <nav aria-label={t("breadcrumb")}>
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        <li>
          <Link href="/" className="hover:text-foreground">
            {t("home")}
          </Link>
        </li>
        {crumbs.map((c) => (
          <Fragment key={c.id}>
            <li aria-hidden className="text-subtle-foreground">
              /
            </li>
            <li>
              <Link href={`/shop/${c.slug}`} className="hover:text-foreground">
                {c.name}
              </Link>
            </li>
          </Fragment>
        ))}
        <li aria-hidden className="text-subtle-foreground">
          /
        </li>
        <li aria-current="page" className="text-foreground">
          {product.name}
        </li>
      </ol>
    </nav>
  );

  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, "\\u003c") }}
      />
      <ProductHero product={product} breadcrumb={breadcrumb} />
      {product.content.story && <ProductStory story={product.content.story} />}
      {product.content.features && <ProductFeatures features={product.content.features} />}
      {(product.specs.length > 0 || product.content.inTheBox?.length) && (
        <ProductSpecs specs={product.specs} inTheBox={product.content.inTheBox} />
      )}
      <RelatedProducts products={product.related} productName={product.name} />
    </>
  );
}

function ProductSkeleton() {
  return (
    <div aria-hidden className="animate-pulse bg-surface pb-24">
      <div className="h-10 bg-secondary" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-10 md:px-8 lg:grid-cols-[minmax(0,1fr)_456px] xl:px-16">
        <div className="aspect-[3/2] rounded-lg bg-accent" />
        <div className="h-[520px] rounded-lg bg-card" />
      </div>
    </div>
  );
}

// No generateStaticParams: products change in the admin, so pages render on
// request from the cached catalog reads.
export default function Page({ params }: Props) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductPage params={params} />
      </Suspense>
    </main>
  );
}
