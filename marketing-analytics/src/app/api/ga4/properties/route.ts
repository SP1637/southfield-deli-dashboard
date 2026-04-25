/**
 * GET /api/ga4/properties
 * Returns the list of GA4 properties the signed-in user has access to.
 * Used to populate the property selector in the dashboard header.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string | undefined;
  if (!accessToken) {
    return NextResponse.json({ error: "No access token" }, { status: 401 });
  }

  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth });

    // List all GA4 properties the user can access
    const accountsRes = await analyticsAdmin.accounts.list();
    const accounts = accountsRes.data.accounts ?? [];

    const properties: Array<{ propertyId: string; displayName: string; name: string }> = [];

    for (const account of accounts) {
      if (!account.name) continue;
      const propsRes = await analyticsAdmin.properties.list({
        filter: `parent:${account.name}`,
      });
      for (const prop of propsRes.data.properties ?? []) {
        if (prop.name && prop.displayName) {
          const propertyId = prop.name.replace("properties/", "");
          properties.push({
            name: prop.name,
            displayName: prop.displayName,
            propertyId,
          });
        }
      }
    }

    return NextResponse.json({ data: properties });
  } catch (err: any) {
    console.error("[GA4 Properties]", err.message);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch properties" },
      { status: 500 }
    );
  }
}
