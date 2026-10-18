import { ArrowRightIcon, CirclePlayIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

// TODO: the Figma banner has a black-and-white sea photo behind the gradient; add it once the image is exported.
export function EditorialBanner() {
  const t = useTranslations("shop.editorial");

  return (
    <section
      aria-labelledby="editorial-title"
      className="relative overflow-hidden rounded-lg bg-[radial-gradient(120%_120%_at_80%_20%,#3a3a3a_0%,#0a0a0a_55%,#000_100%)] text-white"
    >
      <div className="relative flex min-h-[480px] flex-col justify-center px-6 py-16 md:px-20 lg:min-h-[560px]">
        <p className="inline-flex items-center gap-2 self-start rounded-xl bg-white/15 px-3 py-1 text-xs font-medium tracking-[0.1em] text-accent uppercase">
          <span className="size-1.5 rounded-full bg-brand-soft" aria-hidden />
          {t("eyebrow")}
        </p>
        <h2 id="editorial-title" className="mt-4 font-heading text-3xl font-medium tracking-[-0.025em] md:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-[#e5e2e1] md:text-lg md:leading-[29px]">
          {t("body")}
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/journal"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-black transition-colors hover:bg-white/90"
          >
            {t("journal")}
            <ArrowRightIcon className="size-4" />
          </Link>
          <Link
            href="/journal/tarifa-sessions"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-white/10 px-6 text-sm font-medium transition-colors hover:bg-white/20"
          >
            {t("sessions")}
            <CirclePlayIcon className="size-4" />
          </Link>
        </div>

        <p className="mt-10 text-right md:absolute md:right-16 md:bottom-20 md:mt-0">
          <span className="block text-xs font-medium tracking-[0.05em] text-[#c4c7c7] uppercase">{t("locationLabel")}</span>
          <span className="block text-sm text-border">{t("location")}</span>
        </p>
      </div>
    </section>
  );
}
