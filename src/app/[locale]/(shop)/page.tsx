import { getTranslations } from "next-intl/server";

// Placeholder until the Home design is built (M2).
export default async function HomePage() {
  const t = await getTranslations("home");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <h1 className="font-heading text-4xl font-semibold uppercase tracking-tight md:text-6xl">{t("title")}</h1>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </main>
  );
}
