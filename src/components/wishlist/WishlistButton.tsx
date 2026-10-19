"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useAddToWishlistMutation, useRemoveFromWishlistMutation, useWishlist } from "@/redux/api/wishlistApi";
import { apiErrorMessage } from "@/utils/apiError";

interface Props {
  productId: string;
  productName: string;
  /** The selected size/colour on the PDP, remembered with the product. */
  variantId?: string | null;
  className?: string;
}

/**
 * Heart toggle on product cards and the PDP. Visitors are sent to sign in and
 * come back to the same page.
 */
export function WishlistButton(props: Props) {
  return useIsClient() ? <LiveWishlistButton {...props} /> : <HeartButton {...props} saved={false} />;
}

function LiveWishlistButton({ productId, productName, variantId, className }: Props) {
  const t = useTranslations("wishlist");
  const router = useRouter();
  const { user, has } = useWishlist();
  const [add, adding] = useAddToWishlistMutation();
  const [remove, removing] = useRemoveFromWishlistMutation();
  const saved = has(productId);

  const toggle = async () => {
    if (!user) {
      toast.info(t("signIn"));
      // Read on click: usePathname would make every page with a card wait for the request.
      router.push(
        `${ACCOUNT_LINKS.login}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`,
      );
      return;
    }
    try {
      if (saved) {
        await remove(productId).unwrap();
        toast.success(t("removed", { name: productName }));
      } else {
        await add({ productId, variantId }).unwrap();
        toast.success(t("saved", { name: productName }), {
          action: { label: t("view"), onClick: () => router.push(ACCOUNT_LINKS.wishlist) },
        });
      }
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <HeartButton
      productId={productId}
      productName={productName}
      saved={saved}
      busy={adding.isLoading || removing.isLoading}
      onClick={toggle}
      className={className}
    />
  );
}

function HeartButton({
  productName,
  saved,
  busy = false,
  onClick,
  className,
}: Props & { saved: boolean; busy?: boolean; onClick?: () => void }) {
  const t = useTranslations("wishlist");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? t("removeLabel", { name: productName }) : t("saveLabel", { name: productName })}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/90 shadow-xs backdrop-blur-xs transition-colors outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60",
        className,
      )}
    >
      <HeartIcon className={cn("size-4", saved ? "fill-destructive text-destructive" : "text-foreground")} />
    </button>
  );
}
