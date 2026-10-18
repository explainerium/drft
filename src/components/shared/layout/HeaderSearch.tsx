"use client";

import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";

/** Search opens a bar from the top and sends the query to the shop listing (`/shop?q=`). */
export function HeaderSearch() {
  const t = useTranslations("layout.search");
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    if (!q) return;
    setOpen(false);
    router.push({ pathname: "/shop", query: { q } });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("open")} className="text-muted-foreground hover:text-foreground">
          <SearchIcon className="size-[18px]" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="px-4 py-6 md:px-16">
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <SheetDescription className="sr-only">{t("description")}</SheetDescription>
        <form role="search" onSubmit={onSubmit} className="mx-auto flex w-full max-w-2xl items-center gap-2 pr-10">
          <Input
            name="q"
            type="search"
            autoFocus
            maxLength={100}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
            className="h-12 rounded-md px-4"
          />
          <Button type="submit" className="h-12 rounded-md px-6">
            {t("submit")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
