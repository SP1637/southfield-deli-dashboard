/**
 * Server-side session helpers.
 * Gets the current user's DB record (creating it if first sign-in).
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserByEmail, upsertUser, type DbUser } from "@/lib/supabase";
import { cookies } from "next/headers";

/**
 * Returns the DB user for the currently authenticated session.
 * Works for both NextAuth (Google) sessions and demo mode.
 * Returns null if not authenticated.
 */
export async function getCurrentUser(): Promise<DbUser | null> {
  // Demo mode — no real user
  const cookieStore = await cookies();
  if (cookieStore.has("nexoryx_demo")) return null;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  // Upsert so first-time Google sign-in creates the user row
  const user = await upsertUser({
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  });

  return user;
}

/**
 * Like getCurrentUser() but returns 401 response when not authed.
 * Use in API routes.
 */
export async function requireUser(): Promise<DbUser | Response> {
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
