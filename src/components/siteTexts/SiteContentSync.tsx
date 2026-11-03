"use client";

import { useSiteChanges } from "@/lib/siteTexts/sync";
import { baseApi } from "@/redux/api/baseApi";
import { useAppDispatch } from "@/redux/hooks";

/** Dashboard tabs reload site texts and pages when they were saved in another tab (the site in edit mode). */
export function SiteContentSync() {
  const dispatch = useAppDispatch();
  useSiteChanges((change) => dispatch(baseApi.util.invalidateTags(change === "texts" ? ["SiteText"] : ["ContentPage"])));
  return null;
}
