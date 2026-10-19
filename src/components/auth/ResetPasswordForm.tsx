"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { describedBy, Field, PasswordInput, SubmitButton } from "@/components/form/fields";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { apiErrorMessage } from "@/utils/apiError";
import { AuthHeading } from "./AuthShell";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [resetPassword, state] = useResetPasswordMutation();

  const schema = z
    .object({
      password: z.string().min(8, t("errors.passwordLength")).max(72),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: t("errors.passwordMatch"), path: ["confirm"] });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirm: "" },
    mode: "onTouched",
  });

  if (!token) {
    return (
      <>
        <AuthHeading title={t("reset.title")} subtitle={t("reset.missing")} />
        <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
          {t("reset.request")}
        </Link>
      </>
    );
  }

  const onSubmit = handleSubmit(async ({ password }) => {
    try {
      await resetPassword({ token, password }).unwrap();
      toast.success(t("reset.done"));
      router.replace(ACCOUNT_LINKS.login);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  const passwordField = (name: "password" | "confirm") => (
    <Field id={`reset-${name}`} label={t(`reset.${name}`)} error={errors[name]?.message}>
      <PasswordInput
        id={`reset-${name}`}
        autoComplete="new-password"
        showLabel={t("showPassword")}
        hideLabel={t("hidePassword")}
        {...describedBy(`reset-${name}`, errors[name]?.message)}
        {...register(name)}
      />
    </Field>
  );

  return (
    <>
      <AuthHeading title={t("reset.title")} subtitle={t("reset.subtitle")} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {passwordField("password")}
        {passwordField("confirm")}
        <SubmitButton disabled={state.isLoading || state.isSuccess}>
          {state.isLoading ? t("reset.submitting") : t("reset.submit")}
        </SubmitButton>
      </form>
      {state.isError && (
        <p className="mt-4 text-sm">
          <Link href="/forgot-password" className="font-medium text-brand hover:underline">
            {t("reset.request")}
          </Link>
        </p>
      )}
    </>
  );
}
