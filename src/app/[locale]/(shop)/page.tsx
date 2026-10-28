import { Suspense } from "react";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { FeaturedFleet, FeaturedFleetSkeleton } from "@/components/home/FeaturedFleet";
import { HomeHero } from "@/components/home/HomeHero";
import { TrustStrip } from "@/components/home/TrustStrip";

// The product grid streams in from the cached catalog read; the rest is static copy.
export default function HomePage() {
  return (
    <main className="flex-1">
      <HomeHero />
      <Suspense fallback={<FeaturedFleetSkeleton />}>
        <FeaturedFleet />
      </Suspense>
      <AboutTeaser />
      <TrustStrip />
    </main>
  );
}
