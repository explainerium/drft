import { useTranslations } from "next-intl";
import Image from "next/image";
import type { ReactNode } from "react";
import authImage from "@/assets/images/home/hero-tarifa.jpg";
import { Container } from "@/components/shared/Container";

/** Sign-in, register and password pages: an editorial photo beside the form card. */
export function AuthShell({ children }: { children: ReactNode }) {
  const t = useTranslations("auth.side");

  return (
    <main className="flex-1 bg-surface py-10 lg:py-16">
      <Container className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="relative hidden min-h-[560px] overflow-hidden rounded-lg bg-[#1c1b1b] lg:block">
          <Image
            src={authImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            placeholder="blur"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/0" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <p className="text-xs font-medium tracking-[0.05em] text-brand-bright uppercase">{t("eyebrow")}</p>
            <p className="mt-2 max-w-md font-heading text-3xl leading-[38px] font-medium tracking-[-0.025em]">
              {t("title")}
            </p>
            <p className="mt-3 max-w-md text-[15px] leading-6 text-white/80">{t("body")}</p>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full max-w-[480px] rounded-md bg-card p-6 shadow-xs sm:p-10">{children}</div>
        </div>
      </Container>
    </main>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-2">
      <h1 className="font-heading text-3xl font-medium tracking-[-0.025em]">{title}</h1>
      {subtitle && <p className="text-sm leading-[22px] text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
