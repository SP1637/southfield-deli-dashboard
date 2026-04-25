"use client";

import { useState } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toGA4DateString } from "@/lib/utils";

export interface FilterValues {
  startDate: string;
  endDate: string;
  campaign?: string;
  sourceMedium?: string;
  country?: string;
  itemName?: string;
  channelGroup?: string;
  deviceCategory?: string;
}

interface FilterBarProps {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
  show?: Array<"campaign" | "sourceMedium" | "country" | "itemName" | "channelGroup" | "deviceCategory">;
}

const DATE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

export function FilterBar({ filters, onChange, show = [] }: FilterBarProps) {
  const [campaignInput, setCampaignInput] = useState(filters.campaign ?? "");
  const [sourceMediumInput, setSourceMediumInput] = useState(filters.sourceMedium ?? "");

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    onChange({ ...filters, startDate: toGA4DateString(start), endDate: toGA4DateString(end) });
  };

  const clearFilter = (key: keyof FilterValues) => {
    onChange({ ...filters, [key]: undefined });
    if (key === "campaign") setCampaignInput("");
    if (key === "sourceMedium") setSourceMediumInput("");
  };

  const activePreset = DATE_PRESETS.find((p) => {
    const start = toGA4DateString(subDays(new Date(), p.days - 1));
    return filters.startDate === start;
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Date range presets */}
      <div className="flex items-center gap-1 rounded-md border bg-background p-1">
        <Calendar className="ml-1 h-4 w-4 text-muted-foreground" />
        {DATE_PRESETS.map((p) => (
          <button
            key={p.days}
            onClick={() => applyPreset(p.days)}
            className={`rounded px-2.5 py-1 text-xs transition-colors ${
              activePreset?.days === p.days
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Current date range display */}
      <span className="text-xs text-muted-foreground">
        {filters.startDate} → {filters.endDate}
      </span>

      {/* Optional filters */}
      {show.includes("campaign") && (
        <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5">
          <input
            className="w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Campaign…"
            value={campaignInput}
            onChange={(e) => setCampaignInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onChange({ ...filters, campaign: campaignInput })}
          />
          {filters.campaign && (
            <button onClick={() => clearFilter("campaign")}>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {show.includes("sourceMedium") && (
        <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5">
          <input
            className="w-36 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Source / medium…"
            value={sourceMediumInput}
            onChange={(e) => setSourceMediumInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onChange({ ...filters, sourceMedium: sourceMediumInput })}
          />
          {filters.sourceMedium && (
            <button onClick={() => clearFilter("sourceMedium")}>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {show.includes("channelGroup") && (
        <Select
          value={filters.channelGroup ?? "all"}
          onValueChange={(v) => onChange({ ...filters, channelGroup: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <Filter className="mr-1 h-3 w-3" />
            <SelectValue placeholder="Channel group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="Organic Search">Organic Search</SelectItem>
            <SelectItem value="Email">Email</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
            <SelectItem value="Organic Video">Organic Video</SelectItem>
            <SelectItem value="Direct">Direct</SelectItem>
            <SelectItem value="Paid Search">Paid Search</SelectItem>
          </SelectContent>
        </Select>
      )}

      {show.includes("deviceCategory") && (
        <Select
          value={filters.deviceCategory ?? "all"}
          onValueChange={(v) => onChange({ ...filters, deviceCategory: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
