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
import { useRegisterMutation } from "@/redux/api/authApi";
import { apiErrorMessage } from "@/utils/apiError";
import { safeNext } from "@/utils/redirect";
import { AuthHeading } from "./AuthShell";
import { SignedInRedirect } from "./SignedInRedirect";

export function RegisterForm() {
  const t = useTranslations("auth");
  const next = safeNext(useSearchParams().get("next"));
  const router = useRouter();
  const [registerAccount, state] = useRegisterMutation();

  const required = z.string().trim().min(1, t("errors.required")).max(100);
  const schema = z.object({
    firstName: required,
    lastName: required,
    email: z.email(t("errors.email")),
    password: z.string().min(8, t("errors.passwordLength")).max(72),
    // Honeypot: hidden from people, filled in by bots.
    website: z.string(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", website: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async ({ website, ...values }) => {
    try {
      const { user } = await registerAccount({ ...values, ...(website ? { website } : {}) }).unwrap();
      toast.success(t("register.welcome", { name: user.firstName }));
      router.replace(next);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("errors.failed"));
    }
  });

  const text = (name: "firstName" | "lastName", autoComplete: string) => (
    <Field id={`register-${name}`} label={t(`register.${name}`)} error={errors[name]?.message}>
      <TextInput
        id={`register-${name}`}
        autoComplete={autoComplete}
        {...describedBy(`register-${name}`, errors[name]?.message)}
        {...register(name)}
      />
    </Field>
  );

  return (
    <>
      <SignedInRedirect to={next} />
      <AuthHeading title={t("register.title")} subtitle={t("register.subtitle")} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {text("firstName", "given-name")}
          {text("lastName", "family-name")}
        </div>
        <Field id="register-email" label={t("register.email")} error={errors.email?.message}>
          <TextInput
            id="register-email"
            type="email"
            autoComplete="email"
            {...describedBy("register-email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
        <Field
          id="register-password"
          label={t("register.password")}
          hint={t("register.passwordHint")}
          error={errors.password?.message}
        >
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            {...describedBy("register-password", errors.password?.message)}
            {...register("password")}
          />
        </Field>
        <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
          <label htmlFor="register-website">Website</label>
          <input id="register-website" tabIndex={-1} autoComplete="off" {...register("website")} />
        </div>
        <SubmitButton disabled={state.isLoading || state.isSuccess}>
          {state.isLoading ? t("register.submitting") : t("register.submit")}
        </SubmitButton>
        <p className="text-center text-xs leading-5 text-subtle-foreground">
          {t.rich("register.legal", {
            terms: (chunks) => (
              <Link href="/terms" className="underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/privacy" className="underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("register.haveAccount")}{" "}
        <Link
          href={next === "/account" ? ACCOUNT_LINKS.login : `${ACCOUNT_LINKS.login}?next=${encodeURIComponent(next)}`}
          className="font-medium text-brand hover:underline"
        >
          {t("register.login")}
        </Link>
      </p>
    </>
  );
}
