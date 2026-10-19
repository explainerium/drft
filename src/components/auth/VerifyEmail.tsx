"use client";

import { CircleCheckIcon, CircleXIcon, LoaderCircleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { useIsClient } from "@/hooks/useIsClient";
import { Link } from "@/i18n/navigation";
import { useResendVerificationMutation, useSession, useVerifyEmailMutation } from "@/redux/api/authApi";
import { apiErrorMessage } from "@/utils/apiError";
import { AuthHeading } from "./AuthShell";

/** Opened from the verification email: verifies the token once, then says how it went. */
export function VerifyEmail() {
  const t = useTranslations("auth.verify");
  const token = useSearchParams().get("token");
  const [verifyEmail, state] = useVerifyEmailMutation();
  // Once per token: development runs effects twice, and a token works only once.
  const sent = useRef<string | null>(null);

  useEffect(() => {
    if (!token || sent.current === token) return;
    sent.current = token;
    verifyEmail({ token });
  }, [token, verifyEmail]);

  if (!token) return <AuthHeading title={t("title")} subtitle={t("missing")} />;

  if (state.isSuccess) {
    return (
      <div role="status">
        <CircleCheckIcon className="mb-4 size-8 text-success" aria-hidden />
        <AuthHeading title={t("title")} subtitle={t("done")} />
        <Link href={ACCOUNT_LINKS.account} className="text-sm font-medium text-brand hover:underline">
          {t("account")}
        </Link>
      </div>
    );
  }

  if (state.isError) {
    return (
      <div role="alert">
        <CircleXIcon className="mb-4 size-8 text-destructive" aria-hidden />
        <AuthHeading title={t("title")} subtitle={apiErrorMessage(state.error) ?? t("failed")} />
        <ResendLink />
      </div>
    );
  }

  return (
    <div role="status" className="flex items-center gap-3 text-sm text-muted-foreground">
      <LoaderCircleIcon className="size-5 animate-spin" aria-hidden />
      {t("verifying")}
    </div>
  );
}

/** A new link needs the account, so it is offered to signed-in customers only. */
function ResendLink() {
  return useIsClient() ? <LiveResendLink /> : null;
}

function LiveResendLink() {
  const t = useTranslations("auth.verify");
  const { user } = useSession();
  const [resend, state] = useResendVerificationMutation();

  if (!user) {
    return (
      <Link href={`${ACCOUNT_LINKS.login}?next=/account`} className="text-sm font-medium text-brand hover:underline">
        {t("signInToResend")}
      </Link>
    );
  }
  if (state.isSuccess) return <p className="text-sm text-muted-foreground">{t("resent")}</p>;

  return (
    <button
      type="button"
      disabled={state.isLoading}
      onClick={() =>
        resend()
          .unwrap()
          .catch((error: unknown) => toast.error(apiErrorMessage(error) ?? t("failed")))
      }
      className="text-sm font-medium text-brand hover:underline disabled:opacity-60"
    >
      {t("resend")}
    </button>
  );
}
