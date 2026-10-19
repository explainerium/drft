"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { describedBy, Field, PasswordInput, SubmitButton, TextInput } from "@/components/form/fields";
import { ACCOUNT_LINKS } from "@/constants/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useLoginMutation } from "@/redux/api/authApi";
import { apiErrorMessage } from "@/utils/apiError";
import { safeNext } from "@/utils/redirect";
import { AuthHeading } from "./AuthShell";
import { SignedInRedirect } from "./SignedInRedirect";

export function LoginForm() {
  const t = useTranslations("auth");
  const next = safeNext(useSearchParams().get("next"));
  const router = useRouter();
  const [login, state] = useLoginMutation();

  const schema = z.object({
    email: z.email(t("errors.email")),
    password: z.string().min(1, t("errors.required")),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const { user } = await login(values).unwrap();
      toast.success(t("login.welcome", { name: user.firstName }));
      router.replace(next);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  return (
    <>
      <SignedInRedirect to={next} />
      <AuthHeading title={t("login.title")} subtitle={t("login.subtitle")} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id="login-email" label={t("login.email")} error={errors.email?.message}>
          <TextInput
            id="login-email"
            type="email"
            autoComplete="email"
            {...describedBy("login-email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
        <Field
          id="login-password"
          label={t("login.password")}
          hint={
            <Link href="/forgot-password" className="text-brand hover:underline">
              {t("login.forgot")}
            </Link>
          }
          error={errors.password?.message}
        >
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            {...describedBy("login-password", errors.password?.message)}
            {...register("password")}
          />
        </Field>
        <SubmitButton disabled={state.isLoading || state.isSuccess}>
          {state.isLoading ? t("login.submitting") : t("login.submit")}
        </SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("login.noAccount")}{" "}
        <Link
          href={
            next === "/account" ? ACCOUNT_LINKS.register : `${ACCOUNT_LINKS.register}?next=${encodeURIComponent(next)}`
          }
          className="font-medium text-brand hover:underline"
        >
          {t("login.register")}
        </Link>
      </p>
    </>
  );
}
