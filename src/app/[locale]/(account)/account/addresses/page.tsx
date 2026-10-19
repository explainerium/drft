import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AddressBook } from "@/components/account/AddressBook";
import { SignedIn } from "@/components/account/AccountShell";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account.addresses");
  return { title: t("title") };
}

export default function AddressesPage() {
  return (
    <SignedIn>
      <AddressBook />
    </SignedIn>
  );
}
