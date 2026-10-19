"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailWarningIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { describedBy, Field, PasswordInput, SubmitButton, TextInput } from "@/components/form/fields";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { useRouter } from "@/i18n/navigation";
import { useUpdateProfileMutation } from "@/redux/api/accountApi";
import { useChangePasswordMutation, useResendVerificationMutation, useSession } from "@/redux/api/authApi";
import type { User } from "@/types/auth";
import { apiErrorMessage } from "@/utils/apiError";
import { AccountCard } from "./AccountShell";

/** /account: greeting, email verification, profile and password. Rendered inside the session gate. */
export function AccountOverview() {
  const t = useTranslations("account.overview");
  const format = useFormatter();
  const { user } = useSession();
  if (!user) return null;

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-medium tracking-[-0.025em] sm:text-4xl">
          {t("greeting", { name: user.firstName })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("memberSince", { date: format.dateTime(new Date(user.createdAt), { month: "long", year: "numeric" }) })}
        </p>
      </header>
      {!user.emailVerifiedAt && <VerifyBanner email={user.email} />}
      <ProfileForm user={user} />
      <PasswordForm />
    </>
  );
}

function VerifyBanner({ email }: { email: string }) {
  const t = useTranslations("account.verify");
  const [resend, state] = useResendVerificationMutation();

  return (
    <div role="status" className="flex flex-wrap items-start gap-3 rounded-md bg-brand-soft/60 p-4 sm:p-5">
      <MailWarningIcon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{t("title")}</p>
        <p className="text-sm text-muted-foreground">{t("body", { email })}</p>
      </div>
      {state.isSuccess ? (
        <p className="text-sm font-medium text-brand">{t("resent")}</p>
      ) : (
        <button
          type="button"
          disabled={state.isLoading}
          onClick={() =>
            resend()
              .unwrap()
              .catch((error: unknown) => toast.error(apiErrorMessage(error) ?? t("title")))
          }
          className="text-sm font-medium text-brand hover:underline disabled:opacity-60"
        >
          {t("resend")}
        </button>
      )}
    </div>
  );
}

function ProfileForm({ user }: { user: User }) {
  const t = useTranslations("account");
  const [updateProfile, state] = useUpdateProfileMutation();

  const name = z.string().trim().min(1, t("errors.required")).max(100);
  const schema = z.object({ firstName: name, lastName: name, phone: z.string().trim().max(40) });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await updateProfile({ ...values, phone: values.phone || null }).unwrap();
      reset({ firstName: saved.firstName, lastName: saved.lastName, phone: saved.phone ?? "" });
      toast.success(t("profile.saved"));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  const text = (field: "firstName" | "lastName" | "phone", autoComplete: string, type = "text") => (
    <Field id={`profile-${field}`} label={t(`profile.${field}`)} error={errors[field]?.message}>
      <TextInput
        id={`profile-${field}`}
        type={type}
        autoComplete={autoComplete}
        {...describedBy(`profile-${field}`, errors[field]?.message)}
        {...register(field)}
      />
    </Field>
  );

  return (
    <AccountCard id="profile-title" title={t("profile.title")}>
      <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
        {text("firstName", "given-name")}
        {text("lastName", "family-name")}
        <Field id="profile-email" label={t("profile.email")} hint={t("profile.emailHint")}>
          <TextInput id="profile-email" value={user.email} readOnly disabled />
        </Field>
        {text("phone", "tel", "tel")}
        <div className="sm:col-span-2">
          <SubmitButton disabled={!isDirty || state.isLoading} className="sm:w-auto">
            {state.isLoading ? t("profile.saving") : t("profile.save")}
          </SubmitButton>
        </div>
      </form>
    </AccountCard>
  );
}

function PasswordForm() {
  const t = useTranslations("account");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [changePassword, state] = useChangePasswordMutation();

  const schema = z.object({
    currentPassword: z.string().min(1, t("errors.required")).max(72),
    newPassword: z.string().min(8, t("errors.passwordLength")).max(72),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: "", newPassword: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword(values).unwrap();
      // The backend ended every session, this one included.
      toast.success(t("password.done"));
      router.replace(`${ACCOUNT_LINKS.login}?next=${ACCOUNT_LINKS.account}`);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  const field = (name: "currentPassword" | "newPassword", label: string, autoComplete: string) => (
    <Field id={`password-${name}`} label={label} error={errors[name]?.message}>
      <PasswordInput
        id={`password-${name}`}
        autoComplete={autoComplete}
        showLabel={tAuth("showPassword")}
        hideLabel={tAuth("hidePassword")}
        {...describedBy(`password-${name}`, errors[name]?.message)}
        {...register(name)}
      />
    </Field>
  );

  return (
    <AccountCard id="password-title" title={t("password.title")} description={t("password.body")}>
      <form onSubmit={onSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
        {field("currentPassword", t("password.current"), "current-password")}
        {field("newPassword", t("password.new"), "new-password")}
        <div className="sm:col-span-2">
          <SubmitButton disabled={state.isLoading || state.isSuccess} className="sm:w-auto">
            {state.isLoading ? t("password.submitting") : t("password.submit")}
          </SubmitButton>
        </div>
      </form>
    </AccountCard>
  );
}
