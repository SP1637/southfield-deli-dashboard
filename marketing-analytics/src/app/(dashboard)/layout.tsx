import { cookies } from "next/headers";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isDemo = cookieStore.has("nexoryx_demo");

  return (
    <DashboardShell isDemo={isDemo}>
      {children}
    </DashboardShell>
  );
}
