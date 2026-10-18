import { Suspense } from "react";
import { DesignPhilosophy } from "@/components/home/DesignPhilosophy";
import { Disciplines } from "@/components/home/Disciplines";
import { FeaturedFleet, FeaturedFleetSkeleton } from "@/components/home/FeaturedFleet";
import { FieldNotes } from "@/components/home/FieldNotes";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeNewsletter } from "@/components/home/HomeNewsletter";
import { ProductSpotlight } from "@/components/home/ProductSpotlight";
import { TrustStrip } from "@/components/home/TrustStrip";
import { WindJournal } from "@/components/home/WindJournal";

// Catalog sections stream in from the cached reads; the rest is static copy.
export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeHero />
      <Suspense fallback={<FeaturedFleetSkeleton />}>
        <FeaturedFleet />
      </Suspense>
      <DesignPhilosophy />
      <FieldNotes />
      <Suspense>
        <Disciplines />
      </Suspense>
      <Suspense>
        <ProductSpotlight />
      </Suspense>
      <WindJournal />
      <HomeNewsletter />
      <TrustStrip />
    </main>
  );
}
