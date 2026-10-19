"use client";

import { PlusIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useDeleteAddressMutation, useGetAddressesQuery } from "@/redux/api/accountApi";
import type { Address } from "@/types/auth";
import { apiErrorMessage } from "@/utils/apiError";
import { AccountCard } from "./AccountShell";
import { AddressForm } from "./AddressForm";

/** /account/addresses: saved addresses with their default flags; add, edit and delete. */
export function AddressBook() {
  const t = useTranslations("account.addresses");
  const { data: addresses, isLoading, isError, refetch } = useGetAddressesQuery();
  // "new", an address id, or null (just the list).
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-medium tracking-[-0.025em] sm:text-4xl">{t("title")}</h1>
        {editing !== "new" && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/85"
          >
            <PlusIcon className="size-4" aria-hidden />
            {t("add")}
          </button>
        )}
      </div>

      {editing === "new" && (
        <AccountCard id="address-new-title" title={t("newTitle")}>
          <AddressForm onDone={() => setEditing(null)} />
        </AccountCard>
      )}

      {isLoading ? (
        <div aria-hidden className="grid gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-md bg-card" />
          ))}
        </div>
      ) : isError || !addresses ? (
        <div className="flex flex-col items-start gap-3 rounded-md bg-card p-6 shadow-xs">
          <p className="text-sm text-muted-foreground">{t("error")}</p>
          <button type="button" onClick={() => refetch()} className="text-sm font-medium underline">
            {t("retry")}
          </button>
        </div>
      ) : addresses.length === 0 ? (
        editing !== "new" && (
          <p className="rounded-md bg-card p-6 text-sm text-muted-foreground shadow-xs">{t("empty")}</p>
        )
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((address) =>
            editing === address.id ? (
              <li key={address.id} className="md:col-span-2">
                <AccountCard id={`address-${address.id}-title`} title={t("editTitle")}>
                  <AddressForm address={address} onDone={() => setEditing(null)} />
                </AccountCard>
              </li>
            ) : (
              <AddressCard key={address.id} address={address} onEdit={() => setEditing(address.id)} />
            ),
          )}
        </ul>
      )}
    </>
  );
}

function AddressCard({ address, onEdit }: { address: Address; onEdit: () => void }) {
  const t = useTranslations("account.addresses");
  const locale = useLocale();
  const [deleteAddress, deleting] = useDeleteAddressMutation();
  const [confirming, setConfirming] = useState(false);
  const country = new Intl.DisplayNames([locale], { type: "region" }).of(address.countryCode) ?? address.countryCode;
  const lines = [
    address.company,
    address.street1,
    address.street2,
    `${address.postcode} ${address.city}`,
    country,
    address.phone,
  ].filter(Boolean);

  const remove = async () => {
    try {
      await deleteAddress(address.id).unwrap();
      toast.success(t("deleted"));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("error"));
      setConfirming(false);
    }
  };

  return (
    <li className="flex flex-col justify-between gap-4 rounded-md bg-card p-5 shadow-xs">
      <div className="flex flex-col gap-3">
        {(address.isDefaultShipping || address.isDefaultBilling) && (
          <div className="flex flex-wrap gap-2">
            {address.isDefaultShipping && <Badge>{t("defaultShipping")}</Badge>}
            {address.isDefaultBilling && <Badge>{t("defaultBilling")}</Badge>}
          </div>
        )}
        <address className="text-sm leading-[22px] not-italic">
          <span className="block font-semibold">
            {address.firstName} {address.lastName}
          </span>
          {lines.map((line) => (
            <span key={line} className="block text-muted-foreground">
              {line}
            </span>
          ))}
        </address>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
        <button type="button" onClick={onEdit} className="text-brand hover:underline">
          {t("edit")}
        </button>
        {confirming ? (
          <span className="flex items-center gap-3">
            <span className="text-muted-foreground">{t("deleteConfirm")}</span>
            <button
              type="button"
              onClick={remove}
              disabled={deleting.isLoading}
              className="text-destructive hover:underline disabled:opacity-60"
            >
              {t("delete")}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-muted-foreground hover:underline"
            >
              {t("cancel")}
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="text-muted-foreground hover:underline">
            {t("delete")}
          </button>
        )}
      </div>
    </li>
  );
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-sm bg-brand-soft px-2 py-0.5 text-[11px] font-medium tracking-[0.05em] text-brand uppercase">
      {children}
    </span>
  );
}
