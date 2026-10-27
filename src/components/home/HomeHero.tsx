"use client";

import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CirclePlayIcon,
  DropletIcon,
  GaugeIcon,
  PauseIcon,
  PlayIcon,
  WavesIcon,
  WindIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Fragment, useState, useSyncExternalStore } from "react";
import lagoonImage from "@/assets/images/home/hero-lagoon.jpg";
import atlanticImage from "@/assets/images/home/hero-north-atlantic.jpg";
import tarifaImage from "@/assets/images/home/hero-tarifa.jpg";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

// Static until home content is editable in the admin (M6).
const SLIDES = [
  { key: "tarifa", image: tarifaImage, focus: "50% 50%", primaryHref: "/shop", secondaryHref: "/journal", video: true },
  {
    key: "atlantic",
    image: atlanticImage,
    focus: "50% 68%",
    primaryHref: "/shop/kites",
    secondaryHref: "/journal",
    video: false,
  },
  {
    key: "lagoon",
    image: lagoonImage,
    focus: "50% 35%",
    primaryHref: "/products/aero-v3-freeride-kite",
    secondaryHref: "/journal",
    video: true,
  },
] as const;

const CONDITIONS = [
  { key: "wind", Icon: WindIcon, tone: "text-[#e5e2e1]" },
  { key: "swell", Icon: WavesIcon, tone: "text-brand-soft" },
  { key: "baro", Icon: GaugeIcon, tone: "text-[#e5e2e1]" },
  { key: "water", Icon: DropletIcon, tone: "text-brand-soft" },
] as const;

const SLIDE_MS = 7000;
const pad = (n: number) => String(n).padStart(2, "0");

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const subscribeReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

/**
 * Hero slideshow. The progress bar is a CSS animation; when it ends the next
 * slide shows, so pausing (button, hover, focus) simply pauses the animation.
 * No autoplay for people who prefer reduced motion.
 */
export function HomeHero() {
  const t = useTranslations("home.hero");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
  const autoplay = !paused && !reducedMotion;
  const running = autoplay && !hovered;

  const go = (step: number) => setIndex((i) => (i + step + SLIDES.length) % SLIDES.length);
  const slide = SLIDES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t("label")}
      className="grid bg-[#1c1b1b] text-white"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
    >
      <div aria-live={autoplay ? "off" : "polite"} className="grid [grid-area:1/1]">
        {SLIDES.map((s, i) => {
          const active = i === index;
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={s.key}
              role="group"
              aria-roledescription="slide"
              aria-label={t("slide", { index: i + 1, count: SLIDES.length })}
              inert={!active}
              className={cn(
                "relative grid overflow-hidden transition-opacity duration-700 [grid-area:1/1]",
                active ? "opacity-100" : "opacity-0",
              )}
            >
              <Image
                src={s.image}
                alt=""
                fill
                sizes="100vw"
                placeholder="blur"
                priority={i === 0}
                className="object-cover"
                style={{ objectPosition: s.focus }}
              />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

              <Container className="relative flex min-h-[640px] flex-col justify-end pt-24 pb-[104px] lg:min-h-[866px] lg:pb-32">
                <p className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 self-start rounded-xl bg-white/15 px-4 py-1.5 text-xs font-medium tracking-[0.1em] uppercase shadow-xs backdrop-blur-md">
                  <span className="size-1.5 rounded-full bg-brand-bright" aria-hidden />
                  {t(`slides.${s.key}.season`)}
                  <span aria-hidden className="text-white/60">
                    —
                  </span>
                  <span className="text-brand-soft">{t(`slides.${s.key}.expedition`)}</span>
                </p>
                <Heading className="mt-6 font-heading whitespace-pre-line text-5xl leading-none font-semibold tracking-[-0.025em] uppercase md:text-6xl md:leading-[60px]">
                  {t(`slides.${s.key}.title`)}
                </Heading>
                <p className="mt-4 max-w-[530px] text-base leading-relaxed text-[#e5e2e1] md:text-lg md:leading-[29px]">
                  {t(`slides.${s.key}.body`)}
                </p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href={s.primaryHref}
                    className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-medium tracking-[0.02em] text-black uppercase shadow-xs transition-colors hover:bg-white/90"
                  >
                    {t(`slides.${s.key}.primary`)}
                    <ArrowRightIcon className="size-4" />
                  </Link>
                  <Link
                    href={s.secondaryHref}
                    className="inline-flex h-12 items-center gap-1 rounded-xl bg-white/15 px-7 text-sm font-medium tracking-[0.02em] uppercase backdrop-blur-md transition-colors hover:bg-white/25"
                  >
                    {s.video && <CirclePlayIcon className="mr-1 size-5 text-brand-bright" />}
                    {t(`slides.${s.key}.secondary`)}
                  </Link>
                </div>

                <div className="mt-16 text-[11px] leading-6 lg:mt-20">
                  <h2 className="sr-only">{t("conditions")}</h2>
                  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 tracking-[0.055em] uppercase">
                    <li className="flex items-center gap-2 font-medium tracking-[0.1em]">
                      <span className="size-1.5 rounded-full bg-brand-bright" aria-hidden />
                      {t(`slides.${s.key}.spot`)}
                    </li>
                    {CONDITIONS.map(({ key, Icon, tone }) => (
                      <Fragment key={key}>
                        <li aria-hidden className="text-white/20 max-md:hidden">
                          |
                        </li>
                        <li className={cn("flex items-center gap-1.5", tone)}>
                          <Icon className="size-4 text-brand-bright" aria-hidden />
                          {t(`slides.${s.key}.${key}`)}
                        </li>
                      </Fragment>
                    ))}
                  </ul>
                </div>
              </Container>
            </div>
          );
        })}
      </div>

      {/* Pagination, over the slides at the bottom. */}
      <Container className="pointer-events-none relative self-end pb-14 [grid-area:1/1] lg:pb-20">
        <div className="pointer-events-auto flex items-center gap-2 text-[11px] leading-6 tracking-[0.1em] uppercase">
          <span className="font-medium" aria-hidden>
            {pad(index + 1)} / {pad(SLIDES.length)}
          </span>
          <span aria-hidden className="mx-1 h-0.5 w-10 overflow-hidden rounded-full bg-white/20">
            <span
              key={index}
              className={cn("block h-full rounded-full bg-brand-bright", autoplay && "animate-hero-progress")}
              style={
                autoplay
                  ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: running ? "running" : "paused" }
                  : { width: `${((index + 1) / SLIDES.length) * 100}%` }
              }
              onAnimationEnd={() => go(1)}
            />
          </span>
          <span className="text-[#e5e2e1]">{t(`slides.${slide.key}.protocol`)}</span>

          <span className="ml-auto flex gap-1.5">
            {[
              { label: t("previous"), Icon: ChevronLeftIcon, onClick: () => go(-1) },
              paused
                ? { label: t("play"), Icon: PlayIcon, onClick: () => setPaused(false) }
                : { label: t("pause"), Icon: PauseIcon, onClick: () => setPaused(true) },
              { label: t("next"), Icon: ChevronRightIcon, onClick: () => go(1) },
            ].map(({ label, Icon, onClick }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                aria-label={label}
                className="flex size-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md transition-colors outline-none hover:bg-white/20 focus-visible:ring-3 focus-visible:ring-white/50"
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </span>
        </div>
      </Container>
    </section>
  );
}
