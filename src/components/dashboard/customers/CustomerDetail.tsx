"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { OrderStatusBadge } from "@/components/checkout/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ADMIN_LINKS } from "@/constants/admin";
import { useGetAdminOrdersQuery, useGetCustomerQuery, useUpdateCustomerMutation } from "@/redux/api/adminApi";
import { useSession } from "@/redux/api/authApi";
import type { Customer } from "@/types/admin";
import { apiErrorMessage } from "@/utils/apiError";
import { PageHeader, Pagination, QueryError, useAdminFormat } from "../AdminPage";
import { AccountStatusBadge } from "./AccountStatusBadge";

export function CustomerDetail({ id }: { id: string }) {
  const t = useTranslations("admin.customer");
  const { data: customer, isLoading, isError, error, refetch } = useGetCustomerQuery(id);
  const back = { href: ADMIN_LINKS.customers, label: t("back") };

  if (isError) {
    const missing = !!error && "status" in error && (error.status === 404 || error.status === 400);
    return (
      <>
        <PageHeader title={t("notFoundTitle")} back={back} />
        <QueryError onRetry={refetch} message={missing ? t("notFound") : undefined} />
      </>
    );
  }
  if (isLoading || !customer) {
    return (
      <div aria-hidden className="flex flex-col gap-6">
        <Skeleton className="h-14 w-72" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const name = `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() || customer.email;
  return (
    <>
      <PageHeader
        back={back}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {name}
            <AccountStatusBadge status={customer.status} verified={!!customer.emailVerifiedAt} />
          </span>
        }
        description={customer.email}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Stats customer={customer} />
          <CustomerOrders userId={customer.id} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Profile customer={customer} />
          <Addresses customer={customer} />
          <Access customer={customer} />
        </div>
      </div>
    </>
  );
}

function Stats({ customer }: { customer: Customer }) {
  const t = useTranslations("admin.customer");
  const f = useAdminFormat();
  const tiles = [
    { label: t("paidOrders"), value: String(customer.paidOrders) },
    { label: t("totalSpent"), value: f.money(customer.totalSpent) },
    { label: t("customerSince"), value: f.date(customer.createdAt) },
  ];
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
      {tiles.map((tile) => (
        <Card key={tile.label} size="sm">
          <CardHeader>
            <CardDescription>{tile.label}</CardDescription>
            <p className="font-heading text-xl font-medium tabular-nums">{tile.value}</p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

function CustomerOrders({ userId }: { userId: string }) {
  const t = useTranslations("admin.customer");
  const f = useAdminFormat();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetAdminOrdersQuery({ userId, page, limit: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("orders")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        {isError ? (
          <div className="px-4">
            <QueryError onRetry={refetch} />
          </div>
        ) : isLoading || !data ? (
          <Skeleton className="mx-4 h-32" />
        ) : data.data.length === 0 ? (
          <p className="px-4 text-sm text-muted-foreground">{t("noOrders")}</p>
        ) : (
          <ul className="divide-y">
            {data.data.map((order) => (
              <li key={order.id}>
                <Link
                  href={ADMIN_LINKS.order(order.id)}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-accent/60"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-sm font-medium">{order.number}</span>
                    <span className="text-xs text-muted-foreground">{f.dateTime(order.createdAt)}</span>
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <span className="w-24 text-right text-sm font-medium tabular-nums">
                    {f.money(order.total, order.currency)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {data && (
          <div className="px-4">
            <Pagination meta={data.meta} onPage={setPage} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Profile({ customer }: { customer: Customer }) {
  const t = useTranslations("admin.customer");
  const f = useAdminFormat();
  const rows = [
    { label: t("email"), value: customer.email },
    { label: t("phone"), value: customer.phone ?? t("none") },
    {
      label: t("emailStatus"),
      value: customer.emailVerifiedAt ? t("verified", { date: f.date(customer.emailVerifiedAt) }) : t("unverified"),
    },
    { label: t("lastLogin"), value: customer.lastLoginAt ? f.dateTime(customer.lastLoginAt) : t("never") },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("profile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3 text-sm">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="break-words">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function Addresses({ customer }: { customer: Customer }) {
  const t = useTranslations("admin.customer");
  const regionName = new Intl.DisplayNames(["en"], { type: "region" });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("addresses")}</CardTitle>
      </CardHeader>
      <CardContent>
        {customer.addresses.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("noAddresses")}</p>
        ) : (
          <ul className="flex flex-col gap-4 text-sm">
            {customer.addresses.map((address) => (
              <li key={address.id} className="flex flex-col border-b pb-4 last:border-0 last:pb-0">
                {(address.isDefaultShipping || address.isDefaultBilling) && (
                  <span className="mb-1 text-xs font-medium text-muted-foreground">
                    {[
                      address.isDefaultShipping && t("defaultShipping"),
                      address.isDefaultBilling && t("defaultBilling"),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
                <span className="font-medium">
                  {address.firstName} {address.lastName}
                </span>
                {address.company && <span>{address.company}</span>}
                <span>{address.street1}</span>
                {address.street2 && <span>{address.street2}</span>}
                <span>
                  {address.postcode} {address.city}
                </span>
                <span>{regionName.of(address.countryCode) ?? address.countryCode}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Suspend / reactivate. Only an admin may change it (the API enforces the same). */
function Access({ customer }: { customer: Customer }) {
  const t = useTranslations("admin.customer");
  const { user } = useSession();
  const [update, state] = useUpdateCustomerMutation();
  const [confirming, setConfirming] = useState(false);
  const suspended = customer.status === "SUSPENDED";
  const isAdmin = user?.role === "ADMIN";

  const apply = async () => {
    try {
      await update({ id: customer.id, status: suspended ? "ACTIVE" : "SUSPENDED" }).unwrap();
      toast.success(suspended ? t("reactivated") : t("suspended"));
      setConfirming(false);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("access")}</CardTitle>
        <CardDescription>{suspended ? t("suspendedHint") : t("suspendHint")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {!isAdmin ? (
          <p className="text-sm text-muted-foreground">{t("adminOnly")}</p>
        ) : suspended ? (
          <Button variant="outline" onClick={apply} disabled={state.isLoading}>
            {t("reactivate")}
          </Button>
        ) : confirming ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">{t("confirmSuspend")}</p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={apply} disabled={state.isLoading}>
                {t("suspend")}
              </Button>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                {t("keep")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirming(true)}
          >
            {t("suspend")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
