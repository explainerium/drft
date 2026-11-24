"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useRequestReturnMutation } from "@/redux/api/accountApi";
import type { Order } from "@/types/checkout";
import { apiErrorMessage } from "@/utils/apiError";

/**
 * The account order page's return: once the order has shipped the customer can
 * ask to return it (the store gets a notice), then sees what to do next. The
 * same instructions go out by email. `storeAddress` comes from the store settings.
 */
export function OrderReturn({ order, storeAddress }: { order: Order; storeAddress: string }) {
  const t = useTranslations("order.return");
  const format = useFormatter();
  const [confirming, setConfirming] = useState(false);
  const [requestReturn, { isLoading }] = useRequestReturnMutation();

  const submit = async () => {
    try {
      await requestReturn(order.id).unwrap();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  if (order.returnRequestedAt) {
    return (
      <section aria-labelledby="order-return" className="flex flex-col gap-4 rounded-md bg-card p-6 shadow-xs">
        <div>
          <h2 id="order-return" className="font-heading text-xl font-medium tracking-[-0.01em]">
            {t("requested.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("requested.on", { date: format.dateTime(new Date(order.returnRequestedAt), { dateStyle: "long" }) })}
          </p>
        </div>
        <p className="text-sm leading-[22px]">{t("requested.intro")}</p>
        <ol className="flex flex-col gap-3 text-sm leading-[22px]">
          <Step number={1}>{t("requested.pack")}</Step>
          <Step number={2}>{t("requested.note", { number: order.number })}</Step>
          <Step number={3}>
            {storeAddress ? (
              <>
                {t("requested.sendTo")}
                <address className="mt-1 font-medium whitespace-pre-line not-italic">{storeAddress}</address>
              </>
            ) : (
              t.rich("requested.sendToImprint", {
                imprint: (chunks) => (
                  <Link href="/impressum" className="font-medium underline">
                    {chunks}
                  </Link>
                ),
              })
            )}
          </Step>
          <Step number={4}>{t("requested.reply")}</Step>
        </ol>
        <p className="text-xs text-muted-foreground">{t("requested.email")}</p>
      </section>
    );
  }

  if (!order.canReturn) return null;

  return (
    <section aria-labelledby="order-return" className="flex flex-col items-start gap-3 rounded-md bg-card p-6 shadow-xs">
      <h2 id="order-return" className="font-heading text-xl font-medium tracking-[-0.01em]">
        {t("title")}
      </h2>
      <p className="text-sm leading-[22px] text-muted-foreground">{t("body")}</p>
      {confirming ? (
        <div className="flex flex-wrap items-center gap-3 rounded-sm bg-secondary p-4 text-sm">
          <span>{t("confirm", { number: order.number })}</span>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            aria-busy={isLoading}
            className="inline-flex h-10 items-center rounded-sm bg-primary px-4 font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60"
          >
            {t("yes")}
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="font-medium hover:underline">
            {t("cancel")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex h-11 items-center rounded-sm bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
        >
          {t("start")}
        </button>
      )}
    </section>
  );
}

function Step({ number, children }: { number: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold"
      >
        {number}
      </span>
      <div className="pt-0.5">{children}</div>
    </li>
  );
}
