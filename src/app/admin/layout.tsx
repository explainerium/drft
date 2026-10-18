import type { Metadata } from "next";
import { Toaster } from "sonner";
import { StoreProvider } from "@/components/providers/StoreProvider";
import { fontVariables } from "@/lib/fonts";
import "../globals.css";

// The admin is not localized, so it is its own root layout outside [locale].
export const metadata: Metadata = {
  title: { default: "DRFT Admin", template: "%s | DRFT Admin" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <StoreProvider>{children}</StoreProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
