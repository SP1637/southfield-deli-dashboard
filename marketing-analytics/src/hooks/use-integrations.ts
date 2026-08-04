"use client";

import { useEffect, useState, useCallback } from "react";

export interface IntegrationStatus {
  connected: Record<string, boolean>;
  source: "demo" | "database" | "cookies" | "unauthenticated";
  loading: boolean;
  error: string | null;
  refetch: () => void;
  disconnect: (provider: string) => Promise<void>;
}

export function useIntegrations(): IntegrationStatus {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [source, setSource] = useState<IntegrationStatus["source"]>("unauthenticated");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/status");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setConnected(json.connected ?? {});
      setSource(json.source ?? "unauthenticated");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const disconnect = useCallback(async (provider: string) => {
    await fetch("/api/integrations/status", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    setConnected(prev => ({ ...prev, [provider]: false }));
  }, []);

  return { connected, source, loading, error, refetch: fetch_, disconnect };
}
