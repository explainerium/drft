"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { describedBy, Field, SubmitButton, TextInput } from "@/components/form/fields";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { Link } from "@/i18n/navigation";
import { useForgotPasswordMutation } from "@/redux/api/authApi";
import { apiErrorMessage } from "@/utils/apiError";
import { AuthHeading } from "./AuthShell";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [forgotPassword, state] = useForgotPasswordMutation();

  const schema = z.object({ email: z.email(t("errors.email")) });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgotPassword(values).unwrap();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  const back = (
    <p className="mt-6 text-center text-sm">
      <Link href={ACCOUNT_LINKS.login} className="font-medium text-brand hover:underline">
        {t("forgot.back")}
      </Link>
    </p>
  );

  // The answer is the same whether or not the account exists, so nobody can probe emails.
  if (state.isSuccess) {
    return (
      <div role="status">
        <MailCheckIcon className="mb-4 size-8 text-brand" aria-hidden />
        <AuthHeading
          title={t("forgot.sentTitle")}
          subtitle={t("forgot.sentBody", { email: state.originalArgs?.email ?? "" })}
        />
        {back}
      </div>
    );
  }

  return (
    <>
      <AuthHeading title={t("forgot.title")} subtitle={t("forgot.subtitle")} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id="forgot-email" label={t("forgot.email")} error={errors.email?.message}>
          <TextInput
            id="forgot-email"
            type="email"
            autoComplete="email"
            {...describedBy("forgot-email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
        <SubmitButton disabled={state.isLoading}>
          {state.isLoading ? t("forgot.submitting") : t("forgot.submit")}
        </SubmitButton>
      </form>
      {back}
    </>
  );
}
