import { AdminShell } from "@/components/dashboard/AdminShell";

export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
