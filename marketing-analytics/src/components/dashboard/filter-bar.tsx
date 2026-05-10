"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, Filter, X, ChevronDown } from "lucide-react";
import { subDays, format, parseISO, isValid } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn, toGA4DateString } from "@/lib/utils";

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
  show?: Array<
    "campaign" | "sourceMedium" | "country" | "itemName" | "channelGroup" | "deviceCategory"
  >;
}

const DATE_PRESETS = [
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

function safeFmt(dateStr: string) {
  try {
    const d = parseISO(dateStr);
    return isValid(d) ? format(d, "MMM d, yyyy") : dateStr;
  } catch {
    return dateStr;
  }
}

export function FilterBar({ filters, onChange, show = [] }: FilterBarProps) {
  const [campaignInput, setCampaignInput] = useState(filters.campaign ?? "");
  const [sourceMediumInput, setSourceMediumInput] = useState(filters.sourceMedium ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customStart, setCustomStart] = useState(filters.startDate);
  const [customEnd, setCustomEnd] = useState(filters.endDate);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [pickerOpen]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    const s = toGA4DateString(start);
    const e = toGA4DateString(end);
    setCustomStart(s);
    setCustomEnd(e);
    onChange({ ...filters, startDate: s, endDate: e });
    setPickerOpen(false);
  };

  const applyCustom = () => {
    if (customStart && customEnd && customStart <= customEnd) {
      onChange({ ...filters, startDate: customStart, endDate: customEnd });
      setPickerOpen(false);
    }
  };

  const clearFilter = (key: keyof FilterValues) => {
    onChange({ ...filters, [key]: undefined });
    if (key === "campaign") setCampaignInput("");
    if (key === "sourceMedium") setSourceMediumInput("");
  };

  const activePreset = DATE_PRESETS.find(
    (p) => filters.startDate === toGA4DateString(subDays(new Date(), p.days - 1))
  );

  return (
    <div className="flex flex-wrap items-center gap-2">

      {/* ── Date range picker ── */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className={cn(
            "flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary/50 hover:text-foreground",
            pickerOpen ? "border-primary text-foreground" : "text-muted-foreground"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {safeFmt(filters.startDate)} → {safeFmt(filters.endDate)}
          </span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", pickerOpen && "rotate-180")} />
        </button>

        {/* Dropdown panel */}
        {pickerOpen && (
          <div className="absolute left-0 top-full mt-1.5 z-50 w-72 rounded-xl border bg-card p-4 shadow-xl">
            {/* Presets */}
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Quick select
            </p>
            <div className="flex gap-1.5 mb-4">
              {DATE_PRESETS.map((p) => (
                <button
                  key={p.days}
                  onClick={() => applyPreset(p.days)}
                  className={cn(
                    "flex-1 rounded-md py-1.5 text-xs font-medium transition-colors",
                    activePreset?.days === p.days
                      ? "bg-primary text-primary-foreground"
                      : "border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  Last {p.label}
                </button>
              ))}
            </div>

            {/* Custom range */}
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Custom range
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Start</label>
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">End</label>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={toGA4DateString(new Date())}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <Button
              size="sm"
              className="w-full text-xs"
              disabled={!customStart || !customEnd || customStart > customEnd}
              onClick={applyCustom}
            >
              Apply range
            </Button>
          </div>
        )}
      </div>

      {/* ── Campaign filter ── */}
      {show.includes("campaign") && (
        <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5">
          <input
            className="w-32 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Campaign…"
            value={campaignInput}
            onChange={(e) => setCampaignInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && onChange({ ...filters, campaign: campaignInput })
            }
          />
          {filters.campaign && (
            <button onClick={() => clearFilter("campaign")}>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* ── Source / Medium filter ── */}
      {show.includes("sourceMedium") && (
        <div className="flex items-center gap-1 rounded-md border bg-background px-2.5 py-1.5">
          <input
            className="w-36 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            placeholder="Source / medium…"
            value={sourceMediumInput}
            onChange={(e) => setSourceMediumInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              onChange({ ...filters, sourceMedium: sourceMediumInput })
            }
          />
          {filters.sourceMedium && (
            <button onClick={() => clearFilter("sourceMedium")}>
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* ── Channel group ── */}
      {show.includes("channelGroup") && (
        <Select
          value={filters.channelGroup ?? "all"}
          onValueChange={(v) =>
            onChange({ ...filters, channelGroup: v === "all" ? undefined : v })
          }
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

      {/* ── Device category ── */}
      {show.includes("deviceCategory") && (
        <Select
          value={filters.deviceCategory ?? "all"}
          onValueChange={(v) =>
            onChange({ ...filters, deviceCategory: v === "all" ? undefined : v })
          }
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
