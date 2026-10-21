"use client";

import { CheckIcon, ImageIcon, UploadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGetMediaQuery, useUploadMediaMutation } from "@/redux/api/adminCatalogApi";
import type { MediaAsset } from "@/types/adminCatalog";
import { apiErrorMessage } from "@/utils/apiError";
import { Pagination, QueryError } from "../AdminPage";
import { SearchBox } from "../SearchBox";

const PAGE_SIZE = 24;

export const thumbOf = (asset: MediaAsset) => asset.derivatives.thumb?.url ?? asset.url;

/**
 * Picks images from the media library, or uploads new ones (they are selected
 * right away). Images already in use where it was opened are shown as chosen.
 * `single` picks one image (a category photo).
 */
export function MediaPicker({
  open,
  onClose,
  onPick,
  exclude,
  single = false,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (assets: MediaAsset[]) => void;
  exclude: string[];
  single?: boolean;
}) {
  const t = useTranslations("admin.product.media");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MediaAsset[]>([]);
  const { data, isLoading, isError, refetch } = useGetMediaQuery({ page, limit: PAGE_SIZE, search }, { skip: !open });
  const [upload, uploading] = useUploadMediaMutation();
  const input = useRef<HTMLInputElement>(null);

  const toggle = (asset: MediaAsset) =>
    setSelected((current) =>
      current.some((a) => a.id === asset.id)
        ? current.filter((a) => a.id !== asset.id)
        : single
          ? [asset]
          : [...current, asset],
    );

  const onFiles = async (files: FileList | null) => {
    for (const file of Array.from(files ?? [])) {
      try {
        const asset = await upload(file).unwrap();
        setSelected((current) => (single ? [asset] : [...current, asset]));
      } catch (error) {
        toast.error(apiErrorMessage(error) ?? t("uploadFailed", { name: file.name }));
      }
    }
    if (input.current) input.current.value = "";
  };

  const close = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <SearchBox
            defaultValue={search}
            placeholder={t("search")}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="sm:w-72"
          />
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml"
            multiple={!single}
            hidden
            onChange={(event) => onFiles(event.target.files)}
          />
          <Button type="button" variant="outline" disabled={uploading.isLoading} onClick={() => input.current?.click()}>
            <UploadIcon />
            {uploading.isLoading ? t("uploading") : t("upload")}
          </Button>
        </div>
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {isError ? (
            <QueryError onRetry={refetch} />
          ) : isLoading || !data ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-md" />
              ))}
            </div>
          ) : data.data.length === 0 ? (
            <p className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <ImageIcon className="size-5" aria-hidden />
              {t("empty")}
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {data.data.map((asset) => {
                const already = exclude.includes(asset.id);
                const chosen = already || selected.some((a) => a.id === asset.id);
                return (
                  <li key={asset.id}>
                    <button
                      type="button"
                      disabled={already}
                      aria-pressed={chosen}
                      title={asset.originalName}
                      onClick={() => toggle(asset)}
                      className={cn(
                        "relative block aspect-square w-full overflow-hidden rounded-md bg-secondary outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
                        chosen && "ring-2 ring-brand",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbOf(asset)} alt={asset.alt ?? asset.originalName} className="size-full object-cover" />
                      {chosen && (
                        <span className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                          <CheckIcon className="size-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {data && <Pagination meta={data.meta} onPage={setPage} />}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            disabled={selected.length === 0}
            onClick={() => {
              onPick(selected);
              close();
            }}
          >
            {single ? t("choose") : t("add", { count: selected.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
