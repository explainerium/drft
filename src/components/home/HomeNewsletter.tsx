import { ArrowRightIcon, CircleCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/shared/Container";
import { NewsletterForm } from "@/components/shared/layout/NewsletterForm";
import { Link } from "@/i18n/navigation";

const PERKS = ["biweekly", "noNoise", "unsubscribe"] as const;

export function HomeNewsletter() {
  const t = useTranslations("home.newsletter");

  return (
    <section aria-labelledby="newsletter-title" className="bg-accent py-16 lg:py-20">
      <Container>
        <div className="grid items-center gap-8 rounded-lg bg-card p-5 shadow-xs md:p-12 lg:grid-cols-[minmax(0,562px)_390px] lg:justify-between lg:p-20">
          <div>
            <p className="flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-brand uppercase">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />
              {t("eyebrow")}
            </p>
            <h2
              id="newsletter-title"
              className="mt-1 font-heading text-3xl font-medium tracking-[-0.025em] md:text-4xl md:leading-[44px]"
            >
              {t("title")}
            </h2>
            <p className="mt-1 text-[15px] leading-6 text-muted-foreground">{t("body")}</p>
            <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium tracking-[0.02em] text-muted-foreground">
              {PERKS.map((key) => (
                <li key={key} className="flex items-center gap-1.5">
                  <CircleCheckIcon className="size-5 text-brand" aria-hidden />
                  {t(`perks.${key}`)}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg bg-secondary p-4 md:p-6">
            <NewsletterForm
              submitLabel={
                <>
                  {t("submit")}
                  <ArrowRightIcon className="size-4" />
                </>
              }
            />
            <p className="mt-3 text-xs leading-[18px] font-medium tracking-[0.02em] text-muted-foreground">
              {t.rich("consent", {
                link: (chunks) => (
                  <Link href="/privacy" className="text-foreground underline underline-offset-2">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
