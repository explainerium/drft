"use client";

import { useTranslations } from "next-intl";
import { useId, useState } from "react";
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
import type { OrderStatus } from "@/types/checkout";
import { downloadFile } from "@/utils/download";
import { FormField, NativeSelect } from "../products/fields";

/** Orders as CSV for the bookkeeping: one row per order, by status and date range (shop time zone). */
export function OrderExportDialog({
  open,
  onOpenChange,
  statuses,
  initialStatus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: OrderStatus[];
  initialStatus?: OrderStatus;
}) {
  const t = useTranslations("admin.orders.export");
  const ts = useTranslations("admin.orders.status");
  const uid = useId();
  const [status, setStatus] = useState<string>(initialStatus ?? "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [working, setWorking] = useState(false);
  const invalid = !!from && !!to && from > to;

  const run = async () => {
    const query = new URLSearchParams(Object.entries({ status, from, to }).filter(([, value]) => value));
    setWorking(true);
    try {
      await downloadFile(`/api/v1/orders/admin/export${query.size ? `?${query}` : ""}`, "drft-orders.csv");
      onOpenChange(false);
    } catch {
      toast.error(t("failed"));
    } finally {
      setWorking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("hint")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <FormField id={`${uid}status`} label={t("status")}>
            <NativeSelect id={`${uid}status`} value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">{t("allStatuses")}</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {ts(value)}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id={`${uid}from`} label={t("from")}>
              <Input id={`${uid}from`} type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            </FormField>
            <FormField id={`${uid}to`} label={t("to")} error={invalid ? t("range") : undefined}>
              <Input id={`${uid}to`} type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
            </FormField>
          </div>
          <p className="text-xs text-muted-foreground">{t("note")}</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" disabled={working || invalid} onClick={run}>
            {working ? t("working") : t("download")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
