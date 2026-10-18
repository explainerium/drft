import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import fieldNotesImage from "@/assets/images/home/field-notes.jpg";
import { Container } from "@/components/shared/Container";
import { Link } from "@/i18n/navigation";

/** Full-bleed editorial photo with the "North Sea Protocol" card. */
export function FieldNotes() {
  const t = useTranslations("home.fieldNotes");

  return (
    <section aria-labelledby="field-notes-title" className="relative overflow-hidden bg-[#1c1b1b]">
      <Image src={fieldNotesImage} alt="" fill sizes="100vw" placeholder="blur" className="object-cover" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/20" />
      <Container className="relative flex min-h-[560px] items-center justify-end py-32 lg:py-[130px]">
        <div className="w-full max-w-[576px] rounded-lg bg-white/95 p-8 shadow-xl backdrop-blur-md md:p-12">
          <p className="text-xs font-medium tracking-[0.05em] text-brand uppercase">{t("eyebrow")}</p>
          <h2
            id="field-notes-title"
            className="mt-1 font-heading text-3xl font-medium tracking-[-0.025em] md:text-4xl md:leading-[45px]"
          >
            {t("title")}
          </h2>
          <p className="mt-3 text-[15px] leading-6 text-muted-foreground">{t("body")}</p>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <Link href="/journal" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
              {t("cta")}
              <ArrowRightIcon className="size-4" />
            </Link>
            <span className="text-xs font-medium text-muted-foreground">{t("dispatch")}</span>
          </div>
        </div>
      </Container>
    </section>
  );
}
