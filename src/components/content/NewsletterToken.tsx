"use client";

import { CircleCheckIcon, CircleXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { useConfirmSubscriptionMutation, useUnsubscribeMutation } from "@/redux/api/contentApi";

/** Opens the link from a newsletter mail: confirms the sign-up or unsubscribes, once. */
export function NewsletterToken({ action }: { action: "confirm" | "unsubscribe" }) {
  const t = useTranslations(`content.newsletter.${action}`);
  const token = useSearchParams().get("token");
  const [confirm, confirmState] = useConfirmSubscriptionMutation();
  const [unsubscribe, unsubscribeState] = useUnsubscribeMutation();
  const state = action === "confirm" ? confirmState : unsubscribeState;
  const sent = useRef(false);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    void (action === "confirm" ? confirm({ token }) : unsubscribe({ token }));
  }, [action, confirm, token, unsubscribe]);

  const done = state.isSuccess;
  const failed = !token || state.isError;

  return (
    <div className="flex flex-col items-start gap-4 rounded-md bg-card p-6 shadow-xs sm:p-8" role="status">
      {done ? (
        <CircleCheckIcon className="size-7 text-brand" aria-hidden />
      ) : failed ? (
        <CircleXIcon className="size-7 text-destructive" aria-hidden />
      ) : null}
      <h1 className="font-heading text-2xl font-medium tracking-[-0.02em]">
        {done ? t("doneTitle") : failed ? t("failedTitle") : t("working")}
      </h1>
      {(done || failed) && <p className="text-sm text-muted-foreground">{done ? t("doneBody") : t("failedBody")}</p>}
      <Link href="/" className="text-sm font-medium text-brand hover:underline">
        {t("home")}
      </Link>
    </div>
  );
}
