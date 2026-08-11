"use client";

import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { GA4Property } from "@/types";

interface Props {
  value: string;
  onChange: (propertyId: string) => void;
}

export function PropertySelector({ value, onChange }: Props) {
  const { data, isLoading } = useQuery<{ data: GA4Property[] }>({
    queryKey: ["ga4-properties"],
    queryFn: () => fetch("/api/ga4/properties").then((r) => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const properties = data?.data ?? [];

  return (
    <Select value={value} onValueChange={onChange} disabled={isLoading}>
      <SelectTrigger className="w-[220px] text-xs h-9">
        <SelectValue placeholder={isLoading ? "Loading properties…" : "Select GA4 property"} />
      </SelectTrigger>
      <SelectContent>
        {properties.map((p) => (
          <SelectItem key={p.propertyId} value={p.propertyId} className="text-xs">
            {p.displayName}
            <span className="ml-1 text-muted-foreground">({p.propertyId})</span>
          </SelectItem>
        ))}
        {!isLoading && properties.length === 0 && (
          <SelectItem value="__none__" disabled>
            No properties found
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
