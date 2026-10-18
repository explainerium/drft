import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Reassurance } from "@/components/shop/Reassurance";
import { ShopView, ShopViewSkeleton } from "@/components/shop/ShopView";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("shop");
  return { title: t("title"), description: t("description") };
}

async function Results({ searchParams }: { searchParams: PageProps<"/[locale]/shop">["searchParams"] }) {
  return <ShopView searchParams={await searchParams} />;
}

export default function ShopPage({ searchParams }: PageProps<"/[locale]/shop">) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ShopViewSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
      <Reassurance />
    </main>
  );
}
