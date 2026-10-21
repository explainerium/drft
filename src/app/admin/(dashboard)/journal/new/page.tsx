import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentEditor } from "@/components/dashboard/content/ContentEditor";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("newPost") };
}

export default function AdminNewPostPage() {
  return (
    <StaffOnly>
      <ContentEditor kind="post" />
    </StaffOnly>
  );
}
