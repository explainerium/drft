"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { CatalogImageView } from "@/components/shared/CatalogImageView";
import { cn } from "@/lib/utils";
import type { CatalogImage } from "@/types/catalog";

/**
 * Main image + thumbnail strip. `images` comes in display order (variant image first).
 * Photos are never cropped: the frame takes the shape of the first photo and
 * every photo is shown whole inside it.
 */
export function ProductGallery({
  images,
  name,
  badges,
}: {
  images: CatalogImage[];
  name: string;
  badges: { label: string; dot?: boolean }[];
}) {
  const t = useTranslations("product.gallery");
  const [index, setIndex] = useState(0);
  // A variant change can shorten the list; never point past its end.
  const active = images[Math.min(index, images.length - 1)];
  const first = images[0];
  const ratio = first?.width && first.height ? first.width / first.height : 3 / 2;

  return (
    <div className="flex flex-col gap-4">
      {/* No higher than the screen below the header and breadcrumb bar. */}
      <div
        className="relative max-h-[calc(100svh-13rem)] overflow-hidden rounded-lg bg-accent"
        style={{ aspectRatio: ratio }}
      >
        {active ? (
          <CatalogImageView
            key={active.id}
            image={active}
            alt={active.alt ?? name}
            sizes="(min-width: 1280px) 660px, (min-width: 1024px) 55vw, 100vw"
            priority
            className="size-full object-contain"
          />
        ) : (
          <div aria-hidden className="flex size-full items-center justify-center font-heading text-4xl text-subtle-foreground/40">
            DRFT
          </div>
        )}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-1.5 rounded-md bg-background/90 px-2.5 py-1.5 text-xs font-medium"
            >
              {badge.dot && <span className="size-1.5 rounded-full bg-success" aria-hidden />}
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3" aria-label={t("thumbnails")}>
          {images.slice(0, 8).map((image, i) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("show", { index: i + 1 })}
                aria-current={image.id === active?.id}
                className={cn(
                  "block aspect-square w-full overflow-hidden rounded-md bg-accent outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  image.id === active?.id ? "ring-2 ring-foreground" : "opacity-80 hover:opacity-100",
                )}
              >
                <CatalogImageView image={image} alt="" sizes="160px" className="size-full object-contain" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
