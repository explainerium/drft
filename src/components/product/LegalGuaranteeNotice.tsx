"use client";

import { ExternalLinkIcon, ShieldCheckIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// The official files of the European Commission, unchanged (colour version for
// websites), and the page their QR code leads to.
const NOTICE = {
  de: { src: "/legal-guarantee/de.svg", url: "https://europa.eu/youreurope/garantien" },
  en: { src: "/legal-guarantee/en.svg", url: "https://europa.eu/youreurope/guarantees" },
} as const;

/**
 * The EU harmonised notice on the legal guarantee: a line on the product page
 * that opens the full notice on click, with a link to the same page as its QR code.
 */
export function LegalGuaranteeNotice() {
  const t = useTranslations("product.legalGuarantee");
  const notice = useLocale() === "en" ? NOTICE.en : NOTICE.de;

  return (
    <Dialog>
      <DialogTrigger className="mt-4 inline-flex items-center gap-2 text-left text-sm font-medium underline-offset-4 hover:underline">
        <ShieldCheckIcon className="size-4 shrink-0 text-brand" aria-hidden />
        {t("trigger")}
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="max-h-[calc(100svh-2rem)] gap-3 overflow-y-auto rounded-lg p-3 sm:max-w-[640px] sm:p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <DialogTitle className="font-heading text-lg font-medium">{t("title")}</DialogTitle>
          <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-md hover:bg-secondary">
            <XIcon className="size-4" aria-hidden />
            <span className="sr-only">{t("close")}</span>
          </DialogClose>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- an official vector file, shown as is */}
        <img src={notice.src} alt={t("alt")} width={595} height={842} className="h-auto w-full rounded-md" />
        <a
          href={notice.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-brand hover:underline"
        >
          {t("more")}
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </a>
      </DialogContent>
    </Dialog>
  );
}
