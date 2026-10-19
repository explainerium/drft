"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { describedBy, Field, PasswordInput, SubmitButton, TextInput } from "@/components/form/fields";
import { STAFF_ROLES } from "@/constants/auth";
import { adminNext } from "@/constants/admin";
import { useIsClient } from "@/hooks/useIsClient";
import { useLoginMutation, useLogoutMutation, useSession } from "@/redux/api/authApi";
import { apiErrorMessage } from "@/utils/apiError";

const isStaff = (role: string) => (STAFF_ROLES as readonly string[]).includes(role);

export function AdminLoginForm() {
  const t = useTranslations("admin.login");
  const next = adminNext(useSearchParams().get("next"));
  const router = useRouter();
  const [login, state] = useLoginMutation();
  const [logout] = useLogoutMutation();

  const schema = z.object({
    email: z.email(t("invalidEmail")),
    password: z.string().min(1, t("required")),
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
      if (!isStaff(user.role)) {
        // A customer account: do not leave it signed in from the admin login.
        await logout()
          .unwrap()
          .catch(() => undefined);
        toast.error(t("notStaff"));
        return;
      }
      toast.success(t("welcome", { name: user.firstName }));
      router.replace(next);
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  });

  return (
    <>
      {useIsClient() && <StaffRedirect to={next} />}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <Field id="admin-email" label={t("email")} error={errors.email?.message}>
          <TextInput
            id="admin-email"
            type="email"
            autoComplete="username"
            {...describedBy("admin-email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
        <Field id="admin-password" label={t("password")} error={errors.password?.message}>
          <PasswordInput
            id="admin-password"
            autoComplete="current-password"
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
            {...describedBy("admin-password", errors.password?.message)}
            {...register("password")}
          />
        </Field>
        <SubmitButton disabled={state.isLoading}>{state.isLoading ? t("submitting") : t("submit")}</SubmitButton>
      </form>
    </>
  );
}

/** Staff who are already signed in skip the form. */
function StaffRedirect({ to }: { to: string }) {
  const { user } = useSession();
  const router = useRouter();
  const signedIn = !!user && isStaff(user.role);
  useEffect(() => {
    if (signedIn) router.replace(to);
  }, [signedIn, to, router]);
  return null;
}
