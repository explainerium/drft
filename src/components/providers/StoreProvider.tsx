"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/redux/store";

export function StoreProvider({ children }: { children: ReactNode }) {
  // Lazy initial state: the store is created once per mount, never shared across requests.
  const [store] = useState(makeStore);
  return <Provider store={store}>{children}</Provider>;
}
