import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Scopes needed to read GA4 data on behalf of the user
const GA4_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/analytics",
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: `openid email profile ${GA4_SCOPES}`,
          // Force consent screen so refresh token is always returned
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    /**
     * Persist the Google access_token and refresh_token in the JWT so that
     * server-side API routes can call the GA4 Data API on behalf of the user.
     */
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Refresh token if expired (within 60 seconds)
      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() / 1000 > expiresAt - 60) {
        try {
          const refreshed = await refreshAccessToken(token.refreshToken as string);
          return { ...token, ...refreshed };
        } catch {
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Expose accessToken to server components / API routes via getServerSession()
      (session as any).accessToken = token.accessToken;
      (session as any).error = token.error;
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error ?? "Failed to refresh token");

  return {
    accessToken: data.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
  };
}
