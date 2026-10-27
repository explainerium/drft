"use client";

import { FileUpIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { revalidateTags, useImportProductsMutation } from "@/redux/api/adminCatalogApi";
import type { ProductImportResult } from "@/types/adminCatalog";
import { apiErrorMessage } from "@/utils/apiError";

const MAX_BYTES = 900_000;
const SHOWN_ROWS = 200;

/**
 * Bulk price and stock edits: choose the CSV from the export, see every
 * change and error, then apply. Nothing is saved while any row has an error.
 */
export function ProductImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("admin.products.import");
  const [importProducts, state] = useImportProductsMutation();
  const [file, setFile] = useState<{ name: string; csv: string } | null>(null);
  const [check, setCheck] = useState<ProductImportResult | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setCheck(null);
    if (input.current) input.current.value = "";
  };

  const choose = async (picked: File | undefined) => {
    if (!picked) return;
    setCheck(null);
    if (picked.size > MAX_BYTES) {
      toast.error(t("tooLarge"));
      return;
    }
    const csv = await picked.text();
    setFile({ name: picked.name, csv });
    try {
      setCheck(await importProducts({ csv, apply: false }).unwrap());
    } catch (error) {
      setFile(null);
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const apply = async () => {
    if (!file) return;
    try {
      const result = await importProducts({ csv: file.csv, apply: true }).unwrap();
      if (!result.applied) {
        setCheck(result);
        return;
      }
      await revalidateTags(["products"]);
      toast.success(t("applied", { count: result.summary.updates }));
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  const summary = check?.summary;
  const canApply = !!summary && summary.errors === 0 && summary.updates > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("hint")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-sm hover:bg-accent/50">
            <FileUpIcon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{file ? file.name : t("choose")}</span>
              <span className="block text-xs text-muted-foreground">{t("columns")}</span>
            </span>
            <input
              ref={input}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => choose(event.target.files?.[0])}
            />
          </label>

          {state.isLoading && !check && <p className="text-sm text-muted-foreground">{t("checking")}</p>}

          {summary && (
            <>
              <p className="text-sm" aria-live="polite">
                {t("summary", { rows: summary.rows, updates: summary.updates, unchanged: summary.unchanged })}{" "}
                {summary.errors > 0 && (
                  <span className="font-medium text-destructive">{t("errors", { count: summary.errors })}</span>
                )}
              </p>
              {check.rows.length > 0 && (
                <div className="max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-secondary">
                      <tr>
                        <th className="px-3 py-2 font-medium">{t("line")}</th>
                        <th className="px-3 py-2 font-medium">{t("sku")}</th>
                        <th className="px-3 py-2 font-medium">{t("change")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {check.rows.slice(0, SHOWN_ROWS).map((row) => (
                        <tr key={row.line} className="border-t align-top">
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.line}</td>
                          <td className="px-3 py-2">
                            <span className="font-medium">{row.sku || "—"}</span>
                            {row.product && <span className="block text-muted-foreground">{row.product}</span>}
                          </td>
                          <td className={cn("px-3 py-2", row.result === "error" && "text-destructive")}>
                            {row.result === "error"
                              ? row.error
                              : row.changes.map((change) => (
                                  <span key={change.field} className="block">
                                    {t(`fields.${change.field}`)}: {change.from || "—"} → {change.to || "—"}
                                  </span>
                                ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {check.rows.length > SHOWN_ROWS && (
                    <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                      {t("more", { count: check.rows.length - SHOWN_ROWS })}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" disabled={!canApply || state.isLoading} onClick={apply}>
            {state.isLoading && check ? t("applying") : t("apply", { count: summary?.updates ?? 0 })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
