import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ContentEditor } from "@/components/dashboard/content/ContentEditor";
import { pageSkeleton, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("page") };
}

type Props = PageProps<"/admin/pages/[id]">;

async function EditorFor({ params }: { params: Props["params"] }) {
  const { id } = await params;
  return (
    <StaffOnly>
      <ContentEditor kind="page" id={id} />
    </StaffOnly>
  );
}

// The id is only known at request time.
export default function AdminPagePage({ params }: Props) {
  return (
    <Suspense fallback={pageSkeleton}>
      <EditorFor params={params} />
    </Suspense>
  );
}
