import { redirect } from "next/navigation";

// (dashboard)/page.tsx → redirect to the overview page
// The real overview content lives in (dashboard)/overview/page.tsx
export default function DashboardRoot() {
  redirect("/overview");
}
