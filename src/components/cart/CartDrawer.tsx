"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCartOpen } from "@/redux/slices/cartUiSlice";
import { CartPanel } from "./CartPanel";

/** The slide-over cart. Opened by the header button and by Add to Cart. */
export function CartDrawer() {
  const t = useTranslations("cart");
  const open = useAppSelector((state) => state.cartUi.isOpen);
  const dispatch = useAppDispatch();
  const close = () => dispatch(setCartOpen(false));

  return (
    <Sheet open={open} onOpenChange={(next) => dispatch(setCartOpen(next))}>
      <SheetContent side="right" showCloseButton={false} className="gap-0 border-l-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[672px]">
        <SheetDescription className="sr-only">{t("description")}</SheetDescription>
        <CartPanel
          onNavigate={close}
          heading={(title) => (
            <SheetTitle className="font-heading text-3xl font-medium tracking-[-0.025em] text-foreground sm:text-4xl sm:leading-[44px]">
              {title}
            </SheetTitle>
          )}
          closeButton={
            <SheetClose
              aria-label={t("close")}
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary transition-colors outline-none hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <XIcon className="size-4" />
            </SheetClose>
          }
        />
      </SheetContent>
    </Sheet>
  );
}
