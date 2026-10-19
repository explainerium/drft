"use client";

import { useTranslations } from "next-intl";
import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useChangeOrderStatusMutation, useUpdateOrderTrackingMutation } from "@/redux/api/adminApi";
import type { AdminOrder, TrackingInput } from "@/types/admin";
import type { OrderStatus } from "@/types/checkout";
import { apiErrorMessage, apiFieldErrors } from "@/utils/apiError";

type FieldErrors = Record<string, string>;

const toFieldErrors = (error: unknown): FieldErrors =>
  Object.fromEntries(apiFieldErrors(error).map(({ path, message }) => [path, message]));

function TextField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function TrackingFields({
  value,
  onChange,
  errors,
}: {
  value: TrackingInput;
  onChange: (value: TrackingInput) => void;
  errors: FieldErrors;
}) {
  const t = useTranslations("admin.order.dialog");
  const field = (key: keyof TrackingInput, label: string, props: ComponentProps<"input"> = {}) => (
    <TextField id={`tracking-${key}`} label={label} error={errors[key]}>
      <Input
        id={`tracking-${key}`}
        value={value[key] ?? ""}
        onChange={(event) => onChange({ ...value, [key]: event.target.value })}
        aria-invalid={!!errors[key] || undefined}
        aria-describedby={errors[key] ? `tracking-${key}-error` : undefined}
        {...props}
      />
    </TextField>
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {field("trackingCarrier", t("carrier"), { placeholder: "DHL", maxLength: 60 })}
      {field("trackingNumber", t("trackingNumber"), { maxLength: 100 })}
      <div className="sm:col-span-2">
        {field("trackingUrl", t("trackingUrl"), { type: "url", placeholder: "https://", inputMode: "url" })}
      </div>
    </div>
  );
}

/** Confirms a status change; shipping asks for tracking, and shipping or cancelling can email the customer. */
export function StatusDialog({
  order,
  status,
  onClose,
}: {
  order: AdminOrder;
  status: OrderStatus;
  onClose: () => void;
}) {
  const t = useTranslations("admin.order");
  const tStatus = useTranslations("order.status");
  const [change, state] = useChangeOrderStatusMutation();
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState<TrackingInput>({});
  const [notify, setNotify] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const mails = status === "SHIPPED" || status === "CANCELLED";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    try {
      await change({
        id: order.id,
        status,
        note: note.trim() || null,
        ...(status === "SHIPPED" ? tracking : {}),
        notifyCustomer: mails && notify,
      }).unwrap();
      toast.success(t("updated", { status: tStatus(status) }));
      onClose();
    } catch (error) {
      const fields = toFieldErrors(error);
      setErrors(fields);
      // Field errors show under their fields; a toast is for everything else.
      if (Object.keys(fields).length === 0) toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t(`actions.${status}`)}</DialogTitle>
            <DialogDescription>
              {status === "CANCELLED" ? t("dialog.cancelWarning") : t("dialog.description", { number: order.number })}
            </DialogDescription>
          </DialogHeader>
          {status === "SHIPPED" && <TrackingFields value={tracking} onChange={setTracking} errors={errors} />}
          <TextField id="status-note" label={t("dialog.note")} error={errors.note}>
            <Textarea
              id="status-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("dialog.notePlaceholder")}
              maxLength={1000}
              rows={2}
            />
          </TextField>
          {mails && (
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={notify}
                onChange={(event) => setNotify(event.target.checked)}
                className="mt-0.5 size-4 accent-brand"
              />
              <span>
                {t("dialog.notify", { email: order.email })}
                <span className="block text-xs text-muted-foreground">
                  {status === "SHIPPED" ? t("dialog.notifyShipped") : t("dialog.notifyCancelled")}
                </span>
              </span>
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("dialog.back")}
            </Button>
            <Button type="submit" variant={status === "CANCELLED" ? "destructive" : "default"} disabled={state.isLoading}>
              {state.isLoading ? t("dialog.saving") : t(`actions.${status}`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Corrects tracking after shipping. No mail is sent. */
export function TrackingDialog({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const t = useTranslations("admin.order");
  const [update, state] = useUpdateOrderTrackingMutation();
  const [tracking, setTracking] = useState<TrackingInput>({
    trackingCarrier: order.tracking?.carrier ?? "",
    trackingNumber: order.tracking?.number ?? "",
    trackingUrl: order.tracking?.url ?? "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    try {
      await update({ id: order.id, ...tracking }).unwrap();
      toast.success(t("tracking.saved"));
      onClose();
    } catch (error) {
      const fields = toFieldErrors(error);
      setErrors(fields);
      // Field errors show under their fields; a toast is for everything else.
      if (Object.keys(fields).length === 0) toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("tracking.edit")}</DialogTitle>
            <DialogDescription>{t("tracking.hint")}</DialogDescription>
          </DialogHeader>
          <TrackingFields value={tracking} onChange={setTracking} errors={errors} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("dialog.back")}
            </Button>
            <Button type="submit" disabled={state.isLoading}>
              {state.isLoading ? t("dialog.saving") : t("tracking.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
