"use client";

import {
  CheckIcon,
  CopyIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  ImagesIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  revalidateStorefront,
  useCreateMediaFolderMutation,
  useDeleteMediaFolderMutation,
  useDeleteMediaMutation,
  useGetMediaFoldersQuery,
  useGetMediaQuery,
  useUpdateMediaFolderMutation,
  useUpdateMediaMutation,
  useUploadMediaMutation,
} from "@/redux/api/adminCatalogApi";
import type { MediaAsset, MediaFolder } from "@/types/adminCatalog";
import { apiErrorMessage } from "@/utils/apiError";
import { PageHeader, Pagination, QueryError, useAdminFormat } from "../AdminPage";
import { NativeSelect } from "../products/fields";
import { thumbOf } from "../products/MediaPicker";
import { SearchBox } from "../SearchBox";

const PAGE_SIZE = 30;
/** The API's name for "in no folder". */
const UNFILED = "none";
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml";

const bytes = (size: number) =>
  size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`;

function flattenFolders(folders: MediaFolder[], parentId: string | null = null, depth = 0): { folder: MediaFolder; depth: number }[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .flatMap((folder) => [{ folder, depth }, ...flattenFolders(folders, folder.id, depth + 1)]);
}

/** All images, in folders. Filters live in the URL (?folder=&q=&page=). */
export function MediaLibraryView() {
  const t = useTranslations("admin.media");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const folder = searchParams.get("folder") ?? undefined;
  const search = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const setParams = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const folders = useGetMediaFoldersQuery();
  const { data, isLoading, isError, isFetching, refetch } = useGetMediaQuery({
    page,
    limit: PAGE_SIZE,
    search,
    folderId: folder,
  });
  const [upload, uploading] = useUploadMediaMutation();
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const uploadFolder = folder && folder !== UNFILED ? folder : null;

  const onFiles = async (files: FileList | File[]) => {
    let done = 0;
    for (const file of Array.from(files)) {
      try {
        await upload({ file, folderId: uploadFolder }).unwrap();
        done++;
      } catch (error) {
        toast.error(apiErrorMessage(error) ?? t("uploadFailed", { name: file.name }));
      }
    }
    if (done) toast.success(t("uploaded", { count: done }));
    if (input.current) input.current.value = "";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length) void onFiles(event.dataTransfer.files);
  };

  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <input
              ref={input}
              type="file"
              accept={ACCEPT}
              multiple
              hidden
              onChange={(event) => event.target.files && onFiles(event.target.files)}
            />
            <Button onClick={() => input.current?.click()} disabled={uploading.isLoading}>
              <UploadIcon />
              {uploading.isLoading ? t("uploading") : t("upload")}
            </Button>
          </>
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <FolderPanel
          folders={folders.data ?? []}
          loading={folders.isLoading}
          current={folder}
          onSelect={(id) => setParams({ folder: id, page: undefined })}
        />
        <div
          className={cn(
            "flex min-w-0 flex-col gap-4 rounded-xl transition-colors",
            dragging && "bg-brand-soft/40 ring-2 ring-brand ring-dashed",
          )}
          onDragOver={(event) => {
            if (!event.dataTransfer.types.includes("Files")) return;
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={onDrop}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <SearchBox
              key={search}
              defaultValue={search}
              placeholder={t("search")}
              onSearch={(q) => setParams({ q: q || undefined, page: undefined })}
              className="sm:w-80"
            />
            <p className="text-xs text-muted-foreground">{t("dropHint")}</p>
          </div>
          {isError ? (
            <QueryError onRetry={refetch} />
          ) : isLoading || !data ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : data.data.length === 0 ? (
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card py-14 text-sm text-muted-foreground hover:bg-accent/50"
            >
              <ImagesIcon className="size-6" aria-hidden />
              {search ? t("noMatches") : t("empty")}
            </button>
          ) : (
            <ul
              className={cn(
                "grid grid-cols-3 gap-3 transition-opacity sm:grid-cols-4 xl:grid-cols-6",
                isFetching && "opacity-60",
              )}
            >
              {data.data.map((asset) => (
                <li key={asset.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(asset)}
                    className="group flex w-full flex-col gap-1.5 text-left outline-none"
                  >
                    <span className="block aspect-square overflow-hidden rounded-lg bg-secondary ring-1 ring-foreground/10 group-hover:ring-foreground/30 group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumbOf(asset)} alt={asset.alt ?? ""} loading="lazy" className="size-full object-cover" />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{asset.originalName}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && (
            <Pagination meta={data.meta} onPage={(next) => setParams({ page: next > 1 ? String(next) : undefined })} />
          )}
        </div>
      </div>
      {selected && (
        <AssetDialog
          key={selected.id}
          asset={selected}
          folders={folders.data ?? []}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}

function FolderPanel({
  folders,
  loading,
  current,
  onSelect,
}: {
  folders: MediaFolder[];
  loading: boolean;
  current?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const t = useTranslations("admin.media");
  const [create, creating] = useCreateMediaFolderMutation();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [renaming, setRenaming] = useState<MediaFolder | null>(null);
  const parentId = current && current !== UNFILED ? current : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      const folder = await create({ name: name.trim(), parentId }).unwrap();
      setName("");
      setNaming(false);
      onSelect(folder.id);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const entry = (id: string | undefined, label: string, count?: number, depth = 0, folder?: MediaFolder) => {
    const active = current === id;
    const Icon = active ? FolderOpenIcon : FolderIcon;
    return (
      <li key={id ?? "all"} className="group flex items-center">
        <button
          type="button"
          aria-current={active || undefined}
          onClick={() => onSelect(id)}
          style={{ paddingLeft: 8 + depth * 14 }}
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md pr-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            active ? "bg-accent font-medium" : "hover:bg-accent/60",
          )}
        >
          {id === undefined ? <ImagesIcon className="size-4 shrink-0" /> : <Icon className="size-4 shrink-0" />}
          <span className="min-w-0 flex-1 truncate text-left">{label}</span>
          {count !== undefined && <span className="text-xs text-muted-foreground tabular-nums">{count}</span>}
        </button>
        {folder && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={t("renameFolder", { name: folder.name })}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            onClick={() => setRenaming(folder)}
          >
            <PencilIcon />
          </Button>
        )}
      </li>
    );
  };

  return (
    <nav aria-label={t("folders")} className="flex flex-col gap-2 panel p-2">
      <div className="flex items-center justify-between px-2 pt-1">
        <span className="text-xs font-medium text-muted-foreground">{t("folders")}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={parentId ? t("newSubfolder") : t("newFolder")}
          title={parentId ? t("newSubfolder") : t("newFolder")}
          onClick={() => setNaming((v) => !v)}
        >
          <FolderPlusIcon />
        </Button>
      </div>
      {naming && (
        <form onSubmit={submit} className="flex gap-1 px-1">
          <Input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("folderName")}
            aria-label={t("folderName")}
            maxLength={100}
            className="h-8"
          />
          <Button type="submit" size="icon-sm" aria-label={t("createFolder")} disabled={creating.isLoading || !name.trim()}>
            <CheckIcon />
          </Button>
        </form>
      )}
      {loading ? (
        <Skeleton className="mx-1 h-24" />
      ) : (
        <ul className="flex max-h-72 flex-col gap-0.5 overflow-y-auto lg:max-h-none">
          {entry(undefined, t("all"))}
          {entry(UNFILED, t("unfiled"))}
          {flattenFolders(folders).map(({ folder, depth }) =>
            entry(folder.id, folder.name, folder.assetCount, depth, folder),
          )}
        </ul>
      )}
      {renaming && (
        <FolderDialog
          folder={renaming}
          onClose={() => setRenaming(null)}
          onDeleted={() => {
            if (current === renaming.id) onSelect(renaming.parentId ?? undefined);
            setRenaming(null);
          }}
        />
      )}
    </nav>
  );
}

function FolderDialog({ folder, onClose, onDeleted }: { folder: MediaFolder; onClose: () => void; onDeleted: () => void }) {
  const t = useTranslations("admin.media");
  const [name, setName] = useState(folder.name);
  const [update, updating] = useUpdateMediaFolderMutation();
  const [remove, removing] = useDeleteMediaFolderMutation();
  const [confirming, setConfirming] = useState(false);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await update({ id: folder.id, body: { name: name.trim() } }).unwrap();
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("folderTitle")}</DialogTitle>
            <DialogDescription>{t("folderHint", { count: folder.assetCount })}</DialogDescription>
          </DialogHeader>
          <Input value={name} onChange={(event) => setName(event.target.value)} aria-label={t("folderName")} maxLength={100} />
          {confirming && <p className="text-sm">{t("confirmFolderDelete")}</p>}
          <DialogFooter className="sm:justify-between">
            {confirming ? (
              <Button
                type="button"
                variant="destructive"
                disabled={removing.isLoading}
                onClick={async () => {
                  try {
                    await remove(folder.id).unwrap();
                    toast.success(t("folderDeleted", { name: folder.name }));
                    onDeleted();
                  } catch (error) {
                    toast.error(apiErrorMessage(error) ?? t("failed"));
                  }
                }}
              >
                {t("deleteFolder")}
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirming(true)}
              >
                <Trash2Icon />
                {t("deleteFolder")}
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={updating.isLoading || !name.trim() || name.trim() === folder.name}>
                {t("save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** One image: preview, details, alt text, folder, copy URL, delete (refused while in use). */
function AssetDialog({ asset, folders, onClose }: { asset: MediaAsset; folders: MediaFolder[]; onClose: () => void }) {
  const t = useTranslations("admin.media");
  const f = useAdminFormat();
  const [alt, setAlt] = useState(asset.alt ?? "");
  const [folderId, setFolderId] = useState(asset.folderId ?? "");
  const [update, updating] = useUpdateMediaMutation();
  const [remove, removing] = useDeleteMediaMutation();
  const [confirming, setConfirming] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);
  const changed = alt.trim() !== (asset.alt ?? "") || folderId !== (asset.folderId ?? "");
  const absoluteUrl = typeof window === "undefined" ? asset.url : new URL(asset.url, window.location.origin).href;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await update({ id: asset.id, body: { alt: alt.trim() || null, folderId: folderId || null } }).unwrap();
      // Alt text is shown with the image in the store.
      await revalidateStorefront([]);
      toast.success(t("saved"));
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{asset.originalName}</DialogTitle>
            <DialogDescription>
              {[
                asset.width && asset.height ? `${asset.width} × ${asset.height}` : null,
                bytes(asset.sizeBytes),
                asset.mimeType.replace("image/", "").toUpperCase(),
                f.date(asset.createdAt),
              ]
                .filter(Boolean)
                .join(" · ")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-secondary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.derivatives.medium?.url ?? asset.url}
                alt={asset.alt ?? ""}
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`alt-${asset.id}`} className="text-sm font-medium">
                  {t("alt")}
                </label>
                <Input
                  id={`alt-${asset.id}`}
                  value={alt}
                  onChange={(event) => setAlt(event.target.value)}
                  maxLength={250}
                  placeholder={t("altPlaceholder")}
                />
                <p className="text-xs text-muted-foreground">{t("altHint")}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`folder-${asset.id}`} className="text-sm font-medium">
                  {t("folder")}
                </label>
                <NativeSelect id={`folder-${asset.id}`} value={folderId} onChange={(event) => setFolderId(event.target.value)}>
                  <option value="">{t("unfiled")}</option>
                  {flattenFolders(folders).map(({ folder, depth }) => (
                    <option key={folder.id} value={folder.id}>
                      {"— ".repeat(depth)}
                      {folder.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t("url")}</span>
                <div className="flex gap-1">
                  <Input readOnly value={absoluteUrl} aria-label={t("url")} className="text-xs" />
                  <Button type="button" variant="outline" size="icon" aria-label={t("copy")} onClick={copy}>
                    <CopyIcon />
                  </Button>
                </div>
              </div>
              {blocked && (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {blocked}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            {confirming ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={removing.isLoading}
                  onClick={async () => {
                    try {
                      await remove(asset.id).unwrap();
                      toast.success(t("deleted"));
                      onClose();
                    } catch (error) {
                      // 409: the image is still shown somewhere; say where.
                      setBlocked(apiErrorMessage(error) ?? t("failed"));
                      setConfirming(false);
                    }
                  }}
                >
                  {t("confirmDelete")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
                  <XIcon />
                  {t("keep")}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => setConfirming(true)}
              >
                <Trash2Icon />
                {t("delete")}
              </Button>
            )}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose}>
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={!changed || updating.isLoading}>
                {t("save")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

