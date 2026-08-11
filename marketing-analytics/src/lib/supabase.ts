/**
 * Supabase server-side client (service role — never expose to browser).
 * All DB calls go through this; service role bypasses RLS automatically.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ─── Row types (match schema.sql exactly) ─────────────────────────────────────
export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: "free" | "pro" | "enterprise";
  created_at: string;
  updated_at: string;
}

export interface DbIntegration {
  id: string;
  user_id: string;
  provider: string;
  access_token: string | null;
  refresh_token: string | null;
  token_type: string;
  expires_at: string | null;
  scope: string | null;
  metadata: Record<string, unknown>;
  connected_at: string;
  updated_at: string;
}

export interface DbCachedMetric {
  id: string;
  user_id: string;
  provider: string;
  metric_key: string;
  data: unknown;
  cached_at: string;
  expires_at: string;
}

// ─── Database schema type (gives supabase-js full type safety) ────────────────
type Database = {
  public: {
    Tables: {
      users: {
        Row: DbUser;
        Insert: { email: string; name?: string | null; image?: string | null; plan?: string; id?: string };
        Update: Partial<{ email: string; name: string | null; image: string | null; plan: string }>;
      };
      connected_integrations: {
        Row: DbIntegration;
        Insert: {
          user_id: string; provider: string; access_token?: string | null;
          refresh_token?: string | null; token_type?: string; expires_at?: string | null;
          scope?: string | null; metadata?: Record<string, unknown>; id?: string;
        };
        Update: Partial<{
          access_token: string | null; refresh_token: string | null;
          expires_at: string | null; scope: string | null; metadata: Record<string, unknown>;
        }>;
      };
      cached_metrics: {
        Row: DbCachedMetric;
        Insert: {
          user_id: string; provider: string; metric_key: string;
          data: unknown; expires_at: string; id?: string;
        };
        Update: Partial<{ data: unknown; expires_at: string }>;
      };
    };
  };
};

// ─── Client singleton ─────────────────────────────────────────────────────────
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.warn("[supabase] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalForSupabase = global as typeof global & { _supabase?: SupabaseClient<any> };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any> =
  globalForSupabase._supabase ??
  (globalForSupabase._supabase = createClient(url ?? "", serviceKey ?? "", {
    auth: { persistSession: false },
  }));

// ─── User helpers ─────────────────────────────────────────────────────────────
export async function upsertUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from("users")
    .upsert(
      { email: params.email, name: params.name ?? null, image: params.image ?? null },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (error) {
    console.error("[supabase] upsertUser:", error.message);
    return null;
  }
  return data;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error) return null;
  return data;
}

// ─── Integration helpers ──────────────────────────────────────────────────────
export async function saveIntegration(params: {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scope?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const { error } = await supabase
    .from("connected_integrations")
    .upsert(
      {
        user_id: params.userId,
        provider: params.provider,
        access_token: params.accessToken,
        refresh_token: params.refreshToken ?? null,
        expires_at: params.expiresAt?.toISOString() ?? null,
        scope: params.scope ?? null,
        metadata: params.metadata ?? {},
      },
      { onConflict: "user_id,provider" }
    );

  if (error) {
    console.error("[supabase] saveIntegration:", error.message);
    return false;
  }
  return true;
}

export async function getIntegration(
  userId: string,
  provider: string
): Promise<DbIntegration | null> {
  const { data, error } = await supabase
    .from("connected_integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .single();

  if (error) return null;
  return data;
}

export async function getAllIntegrations(userId: string): Promise<DbIntegration[]> {
  const { data, error } = await supabase
    .from("connected_integrations")
    .select("id,provider,metadata,connected_at,expires_at,scope")
    .eq("user_id", userId)
    .order("connected_at", { ascending: false });

  if (error) {
    console.error("[supabase] getAllIntegrations:", error.message);
    return [];
  }
  return (data ?? []) as DbIntegration[];
}

export async function deleteIntegration(userId: string, provider: string): Promise<boolean> {
  const { error } = await supabase
    .from("connected_integrations")
    .delete()
    .eq("user_id", userId)
    .eq("provider", provider);

  if (error) {
    console.error("[supabase] deleteIntegration:", error.message);
    return false;
  }
  return true;
}

// ─── Metrics cache helpers ────────────────────────────────────────────────────
const CACHE_TTL_MINUTES = 15;

export async function getCachedMetric<T>(
  userId: string,
  provider: string,
  metricKey: string
): Promise<T | null> {
  const { data, error } = await supabase
    .from("cached_metrics")
    .select("data, expires_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .eq("metric_key", metricKey)
    .single();

  if (error || !data) return null;
  if (new Date(data.expires_at) < new Date()) return null;
  return data.data as T;
}

export async function setCachedMetric(
  userId: string,
  provider: string,
  metricKey: string,
  data: unknown,
  ttlMinutes = CACHE_TTL_MINUTES
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();
  await supabase
    .from("cached_metrics")
    .upsert(
      { user_id: userId, provider, metric_key: metricKey, data, expires_at: expiresAt },
      { onConflict: "user_id,provider,metric_key" }
    );
}
