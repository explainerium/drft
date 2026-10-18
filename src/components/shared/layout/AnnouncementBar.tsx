import { getTranslations } from "next-intl/server";

export async function AnnouncementBar() {
  const t = await getTranslations("layout");

  return (
    <div className="bg-border px-4 py-2 text-center text-xs font-medium text-muted-foreground">
      {t("announcement")}
    </div>
  );
}
