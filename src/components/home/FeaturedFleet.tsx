import { ArrowRightIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/shared/Container";
import { FLEET_SIZE } from "@/constants/home";
import { Link } from "@/i18n/navigation";
import { getProducts } from "@/lib/catalog";
import { FleetCard } from "./FleetCard";
import { SectionHeader, SectionIntro } from "./SectionHeader";

/** "The 2025 Fleet": the first featured products, as ordered in the admin. */
export async function FeaturedFleet() {
  const [{ data: products, meta }, t] = await Promise.all([
    getProducts({ sort: "featured", limit: FLEET_SIZE }),
    getTranslations("home.fleet"),
  ]);
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="fleet-title" className="bg-surface py-16 lg:py-20">
      <Container>
        <SectionHeader
          id="fleet-title"
          eyebrow={t("eyebrow")}
          title={t("title")}
          aside={<SectionIntro>{t("intro")}</SectionIntro>}
        />
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {products.map((product, i) => (
            <li key={product.id} className="flex">
              <FleetCard product={product} priority={i === 0} />
            </li>
          ))}
        </ul>
        <p className="mt-12 text-center">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
            {t("viewAll", { count: meta.total })}
            <ArrowRightIcon className="size-4" />
          </Link>
        </p>
      </Container>
    </section>
  );
}

export function FeaturedFleetSkeleton() {
  return (
    <div aria-hidden className="animate-pulse bg-surface py-16 lg:py-20">
      <Container className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
        {Array.from({ length: FLEET_SIZE }, (_, i) => (
          <div key={i} className="aspect-[357/687] rounded-lg bg-card" />
        ))}
      </Container>
    </div>
  );
}
