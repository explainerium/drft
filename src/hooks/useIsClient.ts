import { useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

/** False during the server render and hydration, true once mounted in the browser. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
