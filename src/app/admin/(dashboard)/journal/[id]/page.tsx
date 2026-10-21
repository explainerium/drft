import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ContentEditor } from "@/components/dashboard/content/ContentEditor";
import { pageSkeleton, StaffOnly } from "@/components/dashboard/StaffOnly";
import { ADMIN_LOCALE } from "@/constants/admin";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: ADMIN_LOCALE, namespace: "admin.metadata" });
  return { title: t("post") };
}

type Props = PageProps<"/admin/journal/[id]">;

async function EditorFor({ params }: { params: Props["params"] }) {
  const { id } = await params;
  return (
    <StaffOnly>
      <ContentEditor kind="post" id={id} />
    </StaffOnly>
  );
}

// The id is only known at request time.
export default function AdminPostPage({ params }: Props) {
  return (
    <Suspense fallback={pageSkeleton}>
      <EditorFor params={params} />
    </Suspense>
  );
}
