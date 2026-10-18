"use client";

import { useTranslations } from "next-intl";
import type { FormEvent, ReactNode } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const email = z.email();

// UI only: the newsletter API (double opt-in) is built in M6.
export function NewsletterForm({ submitLabel }: { submitLabel?: ReactNode }) {
  const t = useTranslations("layout.footer.newsletter");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email.safeParse(value).success) {
      toast.error(t("invalid"));
      return;
    }
    toast.info(t("comingSoon"));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-md gap-1">
      <Input
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        className="h-12 rounded-md bg-background px-4"
      />
      <Button type="submit" className="h-12 rounded-md px-6">
        {submitLabel ?? t("subscribe")}
      </Button>
    </form>
  );
}
