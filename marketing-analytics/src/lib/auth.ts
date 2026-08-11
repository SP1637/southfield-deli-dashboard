import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * GA4 data is now fetched server-side via a service account (GOOGLE_SERVICE_ACCOUNT_JSON).
 * OAuth only needs openid + email + profile — no sensitive analytics scope.
 * This means ANY Google account can sign in without Google app verification.
 */

// Build providers list dynamically based on available env vars
const providers: NextAuthOptions["providers"] = [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: { scope: "openid email profile" },
    },
  }),
];

// Apple Sign In — requires APPLE_ID, APPLE_SECRET, APPLE_TEAM_ID, APPLE_KEY_ID
if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET,
    })
  );
}

// Microsoft / Azure AD — requires AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET, AZURE_AD_TENANT_ID
if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID ?? "common",
    })
  );
}

// Email / Password (demo credentials — not persisted to a DB)
// In production, swap this for a database adapter + bcrypt hash check.
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Email & Password",
    credentials: {
      email:    { label: "Email",    type: "email" },
      password: { label: "Password", type: "password" },
      name:     { label: "Name",     type: "text"  },
      mode:     { label: "Mode",     type: "text"  }, // "login" | "register"
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      // --- Demo / dev mode: accept any email + password of 6+ chars ---
      if (credentials.password.length >= 6) {
        return {
          id: credentials.email,
          name: credentials.name || credentials.email.split("@")[0],
          email: credentials.email,
          image: null,
        };
      }
      return null;
    },
  })
);

export const authOptions: NextAuthOptions = {
  providers,

  callbacks: {
    async session({ session, token }) {
      // Expose the Google OAuth access token so server-side API routes can call
      // Google APIs (e.g. Analytics Admin to list the user's GA4 properties).
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.name  = user.name;
        token.email = user.email;
      }
      // Persist the access_token on first sign-in (account is only set then).
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },

  pages: {
    signIn: "/login",
    error:  "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
