import { useEffect, useEffectEvent } from "react";

/**
 * Keeps open tabs in step: saving site texts or page content in one tab (the
 * dashboard, or the site in edit mode) tells the other tabs of this browser,
 * which then show the change too. BroadcastChannel only reaches same-origin
 * tabs; nothing leaves the browser.
 */

export type SiteChange = "texts" | "pages";

interface Message {
  change: SiteChange;
  from: string;
}

const CHANNEL = "drft-site-content";
// A tab hears its own messages as well (every channel object does); the id tells them apart.
const TAB = Math.random().toString(36).slice(2);

export function announceSiteChange(change: SiteChange): void {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL);
  channel.postMessage({ change, from: TAB } satisfies Message);
  channel.close();
}

/** Calls `onChange` when another tab saved site texts or page content. */
export function useSiteChanges(onChange: (change: SiteChange) => void): void {
  const handle = useEffectEvent(onChange);
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event: MessageEvent<Message>) => {
      if (event.data?.from !== TAB) handle(event.data.change);
    };
    return () => channel.close();
  }, []);
}
