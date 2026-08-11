/**
 * GET /api/ga4/properties
 *
 * Returns the list of GA4 properties the service account has access to.
 * The service account must be added as a Viewer to the GA4 property first.
 * Used to populate the property selector in the dashboard header.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { buildAdminJWT, getServiceAccountEmail } from "@/lib/ga4/service-account";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Surface the service account email so the connect page can display it
  const serviceAccountEmail = getServiceAccountEmail();

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return NextResponse.json(
      {
        error: "Service account not configured",
        serviceAccountEmail,
        properties: [],
      },
      { status: 503 }
    );
  }

  try {
    const auth = buildAdminJWT();
    const analyticsAdmin = google.analyticsadmin({ version: "v1beta", auth });

    // The service account only sees properties it has been granted access to.
    // accountSummaries lists all such properties without needing to enumerate accounts first.
    const summariesRes = await analyticsAdmin.accountSummaries.list();
    const summaries = summariesRes.data.accountSummaries ?? [];

    const properties: Array<{ propertyId: string; displayName: string; name: string }> = [];

    for (const account of summaries) {
      for (const prop of account.propertySummaries ?? []) {
        if (prop.property && prop.displayName) {
          const propertyId = prop.property.replace("properties/", "");
          properties.push({
            name: prop.property,
            displayName: prop.displayName,
            propertyId,
          });
        }
      }
    }

    return NextResponse.json({ data: properties, serviceAccountEmail });
  } catch (err: any) {
    console.error("[GA4 Properties]", err.message);
    return NextResponse.json(
      { error: err.message ?? "Failed to fetch properties", serviceAccountEmail, properties: [] },
      { status: 500 }
    );
  }
}
