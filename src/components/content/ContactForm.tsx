"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { describedBy, Field, SubmitButton, TextArea, TextInput } from "@/components/form/fields";
import { useSendContactMessageMutation } from "@/redux/api/contentApi";
import { apiErrorMessage } from "@/utils/apiError";

export function ContactForm() {
  const t = useTranslations("content.contact");
  const [send, state] = useSendContactMessageMutation();
  const schema = z.object({
    name: z.string().trim().min(1, t("errors.name")).max(120),
    email: z.email(t("errors.email")),
    subject: z.string().trim().max(160),
    orderNumber: z.string().trim().max(40),
    message: z.string().trim().min(10, t("errors.message")).max(5000),
    website: z.string().max(200),
  });
  type Values = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", subject: "", orderNumber: "", message: "", website: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await send({
        ...values,
        subject: values.subject || undefined,
        orderNumber: values.orderNumber || undefined,
      }).unwrap();
      reset();
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  });

  if (state.isSuccess) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 self-start rounded-md bg-card p-6 shadow-xs sm:p-8">
        <CircleCheckIcon className="size-6 text-brand" aria-hidden />
        <h2 className="font-heading text-2xl font-medium tracking-[-0.02em]">{t("sentTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("sentBody")}</p>
        <button type="button" onClick={() => state.reset()} className="text-sm font-medium text-brand hover:underline">
          {t("another")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative flex flex-col gap-5 rounded-md bg-card p-6 shadow-xs sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label={t("name")} error={errors.name?.message}>
          <TextInput
            id="contact-name"
            autoComplete="name"
            {...describedBy("contact-name", errors.name?.message)}
            {...register("name")}
          />
        </Field>
        <Field id="contact-email" label={t("email")} error={errors.email?.message}>
          <TextInput
            id="contact-email"
            type="email"
            autoComplete="email"
            {...describedBy("contact-email", errors.email?.message)}
            {...register("email")}
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-subject" label={t("subject")} hint={t("optional")}>
          <TextInput id="contact-subject" {...register("subject")} />
        </Field>
        <Field id="contact-order" label={t("orderNumber")} hint={t("optional")}>
          <TextInput id="contact-order" placeholder="DRFT-10001" {...register("orderNumber")} />
        </Field>
      </div>
      <Field id="contact-message" label={t("message")} error={errors.message?.message}>
        <TextArea
          id="contact-message"
          rows={6}
          {...describedBy("contact-message", errors.message?.message)}
          {...register("message")}
        />
      </Field>
      {/* Honeypot: hidden from people, filled in by bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          {t("honeypot")}
          <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
        </label>
      </div>
      <SubmitButton disabled={state.isLoading}>{state.isLoading ? t("sending") : t("send")}</SubmitButton>
    </form>
  );
}
