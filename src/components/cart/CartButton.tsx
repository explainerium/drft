"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIsClient } from "@/hooks/useIsClient";
import { useCart } from "@/redux/api/cartApi";
import { useAppDispatch } from "@/redux/hooks";
import { setCartOpen } from "@/redux/slices/cartUiSlice";

/** Header cart button; opens the drawer. The count is filled in once mounted in the browser. */
export function CartButton() {
  return useIsClient() ? <LiveCartButton /> : <CartButtonView count={0} />;
}

function LiveCartButton() {
  const { data } = useCart();
  return <CartButtonView count={data?.summary.itemCount ?? 0} />;
}

function CartButtonView({ count }: { count: number }) {
  const t = useTranslations("layout.cart");
  const dispatch = useAppDispatch();

  return (
    <button
      type="button"
      onClick={() => dispatch(setCartOpen(true))}
      aria-label={t("label", { count })}
      aria-haspopup="dialog"
      data-cart-button
      className="flex h-8 cursor-pointer items-center gap-1 rounded-md bg-secondary px-3 text-sm font-medium tracking-[-0.005em] transition-colors hover:bg-accent"
    >
      <ShoppingBagIcon className="size-4" />
      <span className="hidden sm:inline">{t("text", { count })}</span>
      <span className="sm:hidden">{count}</span>
    </button>
  );
}
