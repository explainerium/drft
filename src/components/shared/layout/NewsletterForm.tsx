"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscribeMutation } from "@/redux/api/contentApi";
import { apiErrorMessage } from "@/utils/apiError";

const email = z.email();

/**
 * Newsletter sign-up with double opt-in: the API mails a confirmation link,
 * and answers the same whether or not the address is already on the list.
 */
export function NewsletterForm({ submitLabel, source = "footer" }: { submitLabel?: ReactNode; source?: string }) {
  const t = useTranslations("layout.footer.newsletter");
  const [subscribe, state] = useSubscribeMutation();
  const [value, setValue] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = value.trim();
    if (!email.safeParse(address).success) {
      toast.error(t("invalid"));
      return;
    }
    try {
      await subscribe({ email: address, source }).unwrap();
      setValue("");
      toast.success(t("checkInbox"));
    } catch (error) {
      toast.error(apiErrorMessage(error) ?? t("failed"));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md gap-1">
      <Input
        name="email"
        type="email"
        autoComplete="email"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="h-12 rounded-md bg-background px-4"
      />
      <Button type="submit" disabled={state.isLoading} className="h-12 rounded-md px-6">
        {submitLabel ?? t("subscribe")}
      </Button>
    </form>
  );
}
