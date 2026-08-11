/**
 * GET /api/ga4/user-properties
 *
 * Returns the list of GA4 properties that the SIGNED-IN USER personally has
 * access to, using their Google OAuth access token (not the service account).
 *
 * This powers the Databox-style property picker shown after the user signs in
 * with Google during the GA4 connect flow.
 *
 * Requires the Google OAuth sign-in to have requested the scope:
 *   https://www.googleapis.com/auth/analytics.readonly
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface PropertySummary {
  property: string;
  displayName: string;
  propertyType?: string;
}

interface AccountSummary {
  name: string;
  displayName: string;
  propertySummaries?: PropertySummary[];
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken as string | undefined;

  if (!accessToken) {
    return NextResponse.json(
      { error: "no_token", message: "No Google access token found. Please sign in with Google to connect GA4." },
      { status: 403 }
    );
  }

  try {
    const res = await fetch(
      "https://analyticsadmin.googleapis.com/v1beta/accountSummaries",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();

      // 403 usually means the analytics.readonly scope was not granted
      if (res.status === 403) {
        return NextResponse.json(
          { error: "insufficient_scope", message: "Google Analytics access not granted. Please reconnect and allow analytics permissions." },
          { status: 403 }
        );
      }

      // 401 means the token has expired
      if (res.status === 401) {
        return NextResponse.json(
          { error: "token_expired", message: "Google session expired. Please sign in with Google again." },
          { status: 401 }
        );
      }

      console.error("[GA4 user-properties] API error:", res.status, text);
      return NextResponse.json(
        { error: "api_error", message: `Google Analytics API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const accounts: AccountSummary[] = data.accountSummaries ?? [];

    const properties: Array<{
      propertyId: string;
      displayName: string;
      accountName: string;
    }> = [];

    for (const account of accounts) {
      for (const prop of account.propertySummaries ?? []) {
        if (prop.property && prop.displayName) {
          properties.push({
            propertyId: prop.property.replace("properties/", ""),
            displayName: prop.displayName,
            accountName: account.displayName,
          });
        }
      }
    }

    return NextResponse.json({ properties });
  } catch (err: any) {
    console.error("[GA4 user-properties]", err.message);
    return NextResponse.json(
      { error: "fetch_error", message: err.message ?? "Failed to fetch GA4 properties" },
      { status: 500 }
    );
  }
}
