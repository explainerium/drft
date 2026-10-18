import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** The page width used across the storefront: 1280px max, 64px gutters on desktop (Figma grid). */
export function Container({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 md:px-8 xl:px-16", className)} {...props} />;
}
