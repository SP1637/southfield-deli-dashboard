-- ============================================================
-- Nexoryx One — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
-- Mirrors NextAuth session users, keyed by email.
create table if not exists public.users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  name       text,
  image      text,
  plan       text not null default 'free',   -- 'free' | 'pro' | 'enterprise'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Connected Integrations ───────────────────────────────────────────────────
-- One row per (user, provider). Stores encrypted OAuth tokens + metadata.
create table if not exists public.connected_integrations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  provider      text not null,        -- 'ga4' | 'google_ads' | 'meta_ads' | 'shopify' | …
  access_token  text,                 -- AES-encrypted via app-layer before insert
  refresh_token text,                 -- AES-encrypted via app-layer before insert
  token_type    text default 'Bearer',
  expires_at    timestamptz,
  scope         text,
  metadata      jsonb not null default '{}',  -- { propertyId, accountId, shopDomain, … }
  connected_at  timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(user_id, provider)
);

-- ─── Cached Metrics ───────────────────────────────────────────────────────────
-- Avoids hitting platform APIs on every page load. Stale data served from here.
create table if not exists public.cached_metrics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  provider   text not null,           -- 'ga4' | 'google_ads' | …
  metric_key text not null,           -- e.g. 'traffic_30d' | 'ads_overview_7d'
  data       jsonb not null,
  cached_at  timestamptz not null default now(),
  expires_at timestamptz not null,
  unique(user_id, provider, metric_key)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_integrations_user    on public.connected_integrations(user_id);
create index if not exists idx_integrations_provider on public.connected_integrations(provider);
create index if not exists idx_metrics_user_key     on public.cached_metrics(user_id, provider, metric_key);
create index if not exists idx_metrics_expires      on public.cached_metrics(expires_at);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- All reads/writes go through the service-role key (server-side only).
-- Anon/public key cannot access these tables.
alter table public.users                  enable row level security;
alter table public.connected_integrations enable row level security;
alter table public.cached_metrics         enable row level security;

-- Service role bypasses RLS automatically — no policies needed for server-side.
-- If you add a Supabase Auth flow later, add per-user policies here.

-- ─── Updated-at trigger ───────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create or replace trigger integrations_updated_at
  before update on public.connected_integrations
  for each row execute function public.set_updated_at();
