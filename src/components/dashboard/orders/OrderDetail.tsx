"use client";

import { ExternalLinkIcon, PencilIcon, TruckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StatusPill } from "@/components/dashboard/orders/StatusPill";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_LINKS } from "@/constants/admin";
import { useAddOrderNoteMutation, useGetAdminOrderQuery } from "@/redux/api/adminApi";
import type { AdminOrder } from "@/types/admin";
import type { OrderStatus, PostalAddress } from "@/types/checkout";
import { apiErrorMessage } from "@/utils/apiError";
import { PageHeader, QueryError, useAdminFormat } from "../AdminPage";
import { StatusDialog, TrackingDialog } from "./OrderDialogs";

export function OrderDetail({ id }: { id: string }) {
  const t = useTranslations("admin.order");
  const { data: order, isLoading, isError, error, refetch } = useGetAdminOrderQuery(id);
  const back = { href: ADMIN_LINKS.orders, label: t("back") };

  if (isError) {
    const missing = !!error && "status" in error && (error.status === 404 || error.status === 400);
    return (
      <>
        <PageHeader title={t("notFoundTitle")} back={back} />
        <QueryError onRetry={refetch} message={missing ? t("notFound") : undefined} />
      </>
    );
  }
  if (isLoading || !order) {
    return (
      <div aria-hidden className="flex flex-col gap-6">
        <Skeleton className="h-14 w-72" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }
  return <OrderView order={order} back={back} />;
}

function OrderView({ order, back }: { order: AdminOrder; back: { href: string; label: string } }) {
  const t = useTranslations("admin.order");
  const f = useAdminFormat();

  return (
    <>
      <PageHeader
        back={back}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {order.number}
            <StatusPill status={order.status} />
          </span>
        }
        description={t("placed", { date: f.dateTime(order.createdAt) })}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* First in the markup so phones see the status actions before the items. */}
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-2 lg:row-start-1">
          <StatusCard order={order} />
          <CustomerCard order={order} />
          <DeliveryCard order={order} />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <Items order={order} />
          <Notes order={order} />
          <History order={order} />
        </div>
      </div>
    </>
  );
}

function Items({ order }: { order: AdminOrder }) {
  const t = useTranslations("admin.order");
  const f = useAdminFormat();
  const { totals } = order;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("items", { count: order.items.reduce((sum, item) => sum + item.quantity, 0) })}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="divide-y">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {item.imageUrl && (
                  // The snapshot URL of the photo at order time (a storage URL), shown as is.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" loading="lazy" className="size-full object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium">{item.productName}</span>
                {item.options.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {item.options.map((option) => `${option.name}: ${option.value}`).join(" · ")}
                  </span>
                )}
                {item.sku && <span className="text-xs text-muted-foreground">{t("sku", { sku: item.sku })}</span>}
              </div>
              <div className="flex flex-col items-end gap-0.5 text-right">
                <span className="font-medium tabular-nums">{f.money(item.lineTotal, order.currency)}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("unit", { count: item.quantity, price: f.money(item.unitPrice, order.currency) })}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t pt-4 text-sm">
          <Row label={t("subtotal")} value={f.money(totals.subtotal, order.currency)} />
          <Row
            label={t("shipping", { method: order.shippingMethod })}
            value={f.money(totals.shipping, order.currency)}
          />
          <Row
            label={t("vat", { rate: totals.vat.rate })}
            value={f.money(totals.vat.amount, order.currency)}
            muted
          />
          <Row label={t("total")} value={f.money(totals.total, order.currency)} strong />
        </dl>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div
      className={
        strong
          ? "flex justify-between gap-4 border-t pt-2 text-base font-medium"
          : muted
            ? "flex justify-between gap-4 text-muted-foreground"
            : "flex justify-between gap-4"
      }
    >
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function StatusCard({ order }: { order: AdminOrder }) {
  const t = useTranslations("admin.order");
  const f = useAdminFormat();
  const [dialog, setDialog] = useState<OrderStatus | "tracking" | null>(null);
  const shipped = order.status === "SHIPPED" || order.status === "DELIVERED";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("status")}</CardTitle>
        <CardDescription>
          {order.paidAt
            ? t("paidAt", { date: f.dateTime(order.paidAt) })
            : order.status === "PENDING_PAYMENT" && order.reservedUntil
              ? t("reservedUntil", { time: f.dateTime(order.reservedUntil) })
              : t("notPaid")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {order.nextStatuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noActions")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {order.nextStatuses.map((status, index) => (
              <Button
                key={status}
                // The usual next step is the primary one.
                variant={status === "CANCELLED" || index > 0 ? "outline" : "default"}
                className={status === "CANCELLED" ? "text-destructive hover:text-destructive" : undefined}
                onClick={() => setDialog(status)}
              >
                {t(`actions.${status}`)}
              </Button>
            ))}
          </div>
        )}
        {order.status === "PENDING_PAYMENT" && <p className="text-xs text-muted-foreground">{t("paymentHint")}</p>}

        {shipped && (
          <div className="flex flex-col gap-2 border-t pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <TruckIcon className="size-4" />
                {t("tracking.title")}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setDialog("tracking")}>
                <PencilIcon />
                {t("tracking.edit")}
              </Button>
            </div>
            {order.tracking ? (
              <p className="text-sm">
                {order.tracking.carrier && <span className="text-muted-foreground">{order.tracking.carrier} · </span>}
                {order.tracking.url ? (
                  <a
                    href={order.tracking.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                  >
                    {order.tracking.number}
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                ) : (
                  <span className="font-medium">{order.tracking.number}</span>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{t("tracking.none")}</p>
            )}
            {order.shippedAt && (
              <p className="text-xs text-muted-foreground">{t("shippedAt", { date: f.dateTime(order.shippedAt) })}</p>
            )}
          </div>
        )}
      </CardContent>
      {dialog && dialog !== "tracking" && (
        <StatusDialog order={order} status={dialog} onClose={() => setDialog(null)} />
      )}
      {dialog === "tracking" && <TrackingDialog order={order} onClose={() => setDialog(null)} />}
    </Card>
  );
}

function CustomerCard({ order }: { order: AdminOrder }) {
  const t = useTranslations("admin.order");
  const { customer } = order;
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("customer")}</CardTitle>
        {customer.account && (
          <CardAction>
            <Link
              href={ADMIN_LINKS.customer(customer.account.id)}
              className="text-sm font-medium text-brand hover:underline"
            >
              {t("viewCustomer")}
            </Link>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-1 text-sm">
        <span className="font-medium">{customer.name}</span>
        <a href={`mailto:${customer.email}`} className="break-all text-brand hover:underline">
          {customer.email}
        </a>
        {order.phone && <span>{order.phone}</span>}
        <span className="mt-2 text-xs text-muted-foreground">
          {customer.account ? t("accountOrders", { count: customer.account.orderCount }) : t("guest")}
          {" · "}
          {order.marketingOptIn ? t("marketing") : t("noMarketing")}
        </span>
      </CardContent>
    </Card>
  );
}

function DeliveryCard({ order }: { order: AdminOrder }) {
  const t = useTranslations("admin.order");
  const sameBilling = JSON.stringify(order.billingAddress) === JSON.stringify(order.shippingAddress);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("shippingAddress")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <AddressLines address={order.shippingAddress} />
        <div className="flex flex-col gap-1 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">{t("billingAddress")}</span>
          {sameBilling ? <span>{t("sameAsShipping")}</span> : <AddressLines address={order.billingAddress} />}
        </div>
        <div className="flex flex-col gap-1 border-t pt-4">
          <span className="text-xs font-medium text-muted-foreground">{t("method")}</span>
          <span>{order.shippingMethod}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function AddressLines({ address }: { address: PostalAddress }) {
  const country = new Intl.DisplayNames(["en"], { type: "region" }).of(address.countryCode) ?? address.countryCode;
  return (
    <address className="flex flex-col not-italic">
      <span className="font-medium">
        {address.firstName} {address.lastName}
      </span>
      {address.company && <span>{address.company}</span>}
      <span>{address.street1}</span>
      {address.street2 && <span>{address.street2}</span>}
      <span>
        {address.postcode} {address.city}
      </span>
      {address.region && <span>{address.region}</span>}
      <span>{country}</span>
      {address.phone && <span className="text-muted-foreground">{address.phone}</span>}
    </address>
  );
}

function Notes({ order }: { order: AdminOrder }) {
  const t = useTranslations("admin.order.notes");
  const f = useAdminFormat();
  const [body, setBody] = useState("");
  const [addNote, state] = useAddOrderNoteMutation();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    try {
      await addNote({ id: order.id, body: body.trim() }).unwrap();
      setBody("");
      toast.success(t("added"));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("hint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <form onSubmit={submit} className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            maxLength={2000}
            rows={3}
          />
          <Button type="submit" size="sm" className="self-end" disabled={!body.trim() || state.isLoading}>
            {t("add")}
          </Button>
        </form>
        {order.notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {order.notes.map((note) => (
              <li key={note.id} className="rounded-lg bg-secondary px-3 py-2.5">
                <p className="text-sm whitespace-pre-line">{note.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[note.by, f.dateTime(note.createdAt)].filter(Boolean).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function History({ order }: { order: AdminOrder }) {
  const t = useTranslations("admin.order");
  const f = useAdminFormat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("history")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {[...order.history].reverse().map((entry, index, all) => (
            <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < all.length - 1 && (
                <span aria-hidden className="absolute top-4 bottom-0 left-[5px] w-px bg-border" />
              )}
              <span
                aria-hidden
                className={
                  index === 0
                    ? "mt-1.5 size-[11px] shrink-0 rounded-full bg-brand"
                    : "mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-border bg-card"
                }
              />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-medium">{t(`historyStatus.${entry.status}`)}</span>
                {entry.note && <span className="text-sm text-muted-foreground">{entry.note}</span>}
                <span className="text-xs text-muted-foreground">
                  {f.dateTime(entry.createdAt)}
                  {entry.by && ` · ${t("by", { name: entry.by })}`}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
