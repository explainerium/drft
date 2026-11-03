import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { ADMIN_TIME_ZONE } from "@/constants/admin";
import type { Locale } from "@/i18n/routing";
import en from "../../../messages/en.json";
import { EditablePage } from "./EditablePage";

/**
 * A page's content while staff edit the site, with the in-place editor's own
 * labels (English, like the rest of the admin). Visitors never get this: the
 * page renders it in edit mode only.
 */
export function EditablePageLoader({ slug, locale, children }: { slug: string; locale: Locale; children: ReactNode }) {
  return (
    <NextIntlClientProvider
      locale="en"
      messages={{ admin: { siteTexts: en.admin.siteTexts, product: { editor: en.admin.product.editor } } }}
      timeZone={ADMIN_TIME_ZONE}
    >
      <EditablePage slug={slug} locale={locale}>
        {children}
      </EditablePage>
    </NextIntlClientProvider>
  );
}
