/**
 * GET /api/ga4/service-account-email
 * Returns the service account email for display in the connect/onboarding page.
 * Requires an authenticated session so it's not publicly exposed.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getServiceAccountEmail } from "@/lib/ga4/service-account";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ email: getServiceAccountEmail() });
}
