"use client";

import { authApi } from "@/redux/api/authApi";

const ENDPOINT = "/api/internal/edit-texts";

/**
 * Switching on-page text editing on and off. `start` checks the session first:
 * the access token lasts 15 minutes and the switch only sees cookies, so an
 * idle admin tab gets a fresh token before asking. From the dashboard the site
 * opens in a new tab, so both stay open side by side.
 */
export function useTextEditing() {
  const [checkSession] = authApi.endpoints.getMe.useLazyQuery();

  /** Turns editing on and opens `path` in it. False when the session is not staff. */
  const start = async (path: string, { newTab = false } = {}): Promise<boolean> => {
    // Opened during the click, before anything is awaited: browsers block tabs opened later.
    const tab = newTab ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    await checkSession().unwrap().catch(() => null);
    const res = await fetch(ENDPOINT, { method: "POST" }).catch(() => null);
    if (!res?.ok) {
      tab?.close();
      return false;
    }
    // A blocked tab falls back to this one.
    if (tab) tab.location.href = path;
    else window.location.assign(path);
    return true;
  };

  return { start };
}

/** Turns editing off and reloads the page as visitors see it. */
export async function stopTextEditing() {
  await fetch(ENDPOINT, { method: "DELETE" }).catch(() => undefined);
  window.location.reload();
}
