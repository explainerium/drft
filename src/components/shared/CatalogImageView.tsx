import { preconnect } from "react-dom";
import type { CatalogImage } from "@/types/catalog";

/**
 * Plain <img> on purpose: the backend already makes WebP derivatives
 * (thumb 400 / medium 1024 / large 2048), so the browser picks one from
 * `srcSet` and the Next image optimizer would only re-encode them.
 */
export function CatalogImageView({
  image,
  sizes,
  alt,
  className,
  priority = false,
}: {
  image: CatalogImage;
  sizes: string;
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  const variants = Object.values(image.sizes).filter((s) => s !== undefined);
  const srcSet = variants.length ? variants.map((s) => `${s.url} ${s.width}w`).join(", ") : undefined;
  const fallback = image.sizes.medium ?? image.sizes.large ?? image.sizes.thumb;
  const src = fallback?.url ?? image.url;
  // Images live on the storage host: open that connection early for the image that paints first.
  if (priority && /^https?:/.test(src)) preconnect(new URL(src).origin);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      width={fallback?.width ?? image.width ?? undefined}
      height={fallback?.height ?? image.height ?? undefined}
      alt={alt ?? image.alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      className={className}
    />
  );
}
