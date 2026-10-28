"use client";

import { CopyIcon, EyeIcon, EyeOffIcon, PencilIcon, Trash2Icon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ADMIN_LINKS } from "@/constants/admin";
import {
  revalidateStorefront,
  useDeleteProductMutation,
  useDuplicateProductMutation,
  useUpdateProductMutation,
} from "@/redux/api/adminCatalogApi";
import type { AdminProductRow } from "@/types/adminCatalog";
import { apiErrorMessage } from "@/utils/apiError";

/** One icon button with its name as label and tooltip. */
function ActionButton({
  label,
  Icon,
  onClick,
  disabled,
  destructive = false,
}: {
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  disabled: boolean;
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          className={destructive ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : undefined}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** The actions of a product row, always visible: edit, publish or move to draft, duplicate, delete. */
export function ProductRowActions({ product }: { product: AdminProductRow }) {
  const t = useTranslations("admin.products.actions");
  const td = useTranslations("admin.product.delete");
  const router = useRouter();
  const [update, updating] = useUpdateProductMutation();
  const [duplicate, duplicating] = useDuplicateProductMutation();
  const [remove, removing] = useDeleteProductMutation();
  const [confirming, setConfirming] = useState(false);
  const published = product.status === "PUBLISHED";
  const busy = updating.isLoading || duplicating.isLoading || removing.isLoading;

  const setStatus = async () => {
    const status = published ? "DRAFT" : "PUBLISHED";
    try {
      await update({ id: product.id, body: { status } }).unwrap();
      await revalidateStorefront([product.slug]);
      toast.success(published ? t("drafted", { name: product.name }) : t("published", { name: product.name }));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const copy = async () => {
    try {
      const created = await duplicate(product.id).unwrap();
      toast.success(t("duplicated", { name: created.name }));
      router.push(ADMIN_LINKS.product(created.id));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const confirmDelete = async () => {
    try {
      await remove(product.id).unwrap();
      await revalidateStorefront([product.slug]);
      toast.success(td("done", { name: product.name }));
      setConfirming(false);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? td("failed"));
    }
  };

  return (
    // The row opens the editor on click; the menu must not.
    <div onClick={(event) => event.stopPropagation()} className="flex justify-end gap-0.5">
      <ActionButton
        label={t("edit")}
        Icon={PencilIcon}
        disabled={busy}
        onClick={() => router.push(ADMIN_LINKS.product(product.id))}
      />
      <ActionButton
        label={published ? t("toDraft") : t("publish")}
        Icon={published ? EyeOffIcon : EyeIcon}
        disabled={busy}
        onClick={setStatus}
      />
      <ActionButton label={t("duplicate")} Icon={CopyIcon} disabled={busy} onClick={copy} />
      <ActionButton label={t("delete")} Icon={Trash2Icon} disabled={busy} destructive onClick={() => setConfirming(true)} />

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{td("confirmTitle", { name: product.name })}</DialogTitle>
            <DialogDescription>{td("confirmBody")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              {td("cancel")}
            </Button>
            <Button type="button" variant="destructive" disabled={removing.isLoading} onClick={confirmDelete}>
              {td("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
