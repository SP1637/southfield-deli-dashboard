"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect / → /overview inside the dashboard shell */
export default function DashboardRoot() {
  const router = useRouter();
  useEffect(() => { router.replace("/overview"); }, [router]);
  return null;
}
