import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { MessagesView } from "@/components/dashboard/content/InboxViews";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("messages") };
}

// Filters are read from the URL in the browser, which a prerender cannot know.
export default function AdminMessagesPage() {
  return (
    <StaffOnly>
      <Suspense>
        <MessagesView />
      </Suspense>
    </StaffOnly>
  );
}
