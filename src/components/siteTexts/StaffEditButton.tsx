"use client";

import { PencilLineIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { STAFF_ROLES } from "@/constants/auth";
import { useIsClient } from "@/hooks/useIsClient";
import { useSession } from "@/redux/api/authApi";
import { useTextEditing } from "./useTextEditing";

/**
 * "Edit this page" for signed-in staff, on every storefront page: one click
 * switches on-page editing. Visitors and customers never see it; the page
 * itself stays prerendered (the button decides in the browser).
 */
export function StaffEditButton() {
  return useIsClient() ? <LiveStaffEditButton /> : null;
}

function LiveStaffEditButton() {
  const t = useTranslations("layout.account");
  const { user } = useSession();
  const { start } = useTextEditing();
  if (!user || !(STAFF_ROLES as readonly string[]).includes(user.role)) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        if (!(await start(window.location.pathname + window.location.search))) toast.error(t("editTextsFailed"));
      }}
      className="fixed bottom-4 left-4 z-[60] flex h-10 items-center gap-2 rounded-md bg-foreground px-3.5 text-sm font-medium text-background shadow-lg hover:bg-foreground/85 focus-visible:ring-3 focus-visible:ring-brand-bright/60 focus-visible:outline-none"
    >
      <PencilLineIcon className="size-4" />
      {t("editTexts")}
    </button>
  );
}
