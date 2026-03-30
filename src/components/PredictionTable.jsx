"use client";

import { useState, useMemo } from "react";

const PILL_PALETTE = [
  "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "bg-violet-500/15 text-violet-400 border-violet-500/30",
  "bg-teal-500/15 text-teal-400 border-teal-500/30",
  "bg-orange-500/15 text-orange-400 border-orange-500/30",
];

function getPill(group, allGroups) {
  const idx = allGroups.indexOf(group);
  return PILL_PALETTE[idx >= 0 ? idx % PILL_PALETTE.length : 0];
}

function formatName(raw) {
  return raw
    .replace(/\s*-\s*SNG\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function ActionBadge({ action }) {
  const isSkip = action === "Do not prepare";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
        isSkip
          ? "bg-red-500/10 text-red-400 border-red-500/25"
          : "bg-green-500/10 text-green-400 border-green-500/25"
      }`}
    >
      {isSkip ? (
        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2.5}>
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={2.5}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {action}
    </span>
  );
}

function SortIcon({ active, direction }) {
  return (
    <span className="inline-flex flex-col ml-1.5 opacity-60">
      <svg viewBox="0 0 8 5" fill="none" className={`w-2 h-2 ${active && direction === "asc" ? "opacity-100 text-cyan-400" : "text-slate-500"}`}>
        <path d="M4 0L8 5H0L4 0z" fill="currentColor" />
      </svg>
      <svg viewBox="0 0 8 5" fill="none" className={`w-2 h-2 mt-0.5 ${active && direction === "desc" ? "opacity-100 text-cyan-400" : "text-slate-500"}`}>
        <path d="M4 5L0 0H8L4 5z" fill="currentColor" />
      </svg>
    </span>
  );
}

const COLUMNS = [
  { key: "Item Group",    label: "Category"  },
  { key: "Item Name",     label: "Item"      },
  { key: "Predicted_Qty", label: "Qty"       },
  { key: "Action",        label: "Action"    },
];

export default function PredictionTable({ predictions, allGroups }) {
  const [groupFilter, setGroupFilter] = useState("All");
  const [search,      setSearch]      = useState("");
  const [sortCol,     setSortCol]     = useState("Item Group");
  const [sortDir,     setSortDir]     = useState("asc");
  const [showSkip,    setShowSkip]    = useState(true);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = useMemo(() => {
    let rows = [...predictions];
    if (groupFilter !== "All") rows = rows.filter((r) => r["Item Group"] === groupFilter);
    if (!showSkip) rows = rows.filter((r) => r.Predicted_Qty > 0);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r["Item Name"].toLowerCase().includes(q) ||
        r["Item Group"].toLowerCase().includes(q)
      );
    }
    rows.sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol];
      if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return rows;
  }, [predictions, groupFilter, search, sortCol, sortDir, showSkip]);

  return (
    <div className="bg-[#0f1f3d] border border-[#1e3a6e] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="p-5 border-b border-[#1e3a6e]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Preparation List</p>
              <p className="text-slate-400 text-xs mt-0.5">{filtered.length} products shown</p>
            </div>
            <button
              onClick={() => setShowSkip((v) => !v)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                showSkip
                  ? "bg-[#1a2f52] border-[#254c8e] text-slate-300 hover:border-cyan-500"
                  : "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
              }`}
            >
              {showSkip ? "Hide skipped" : "Show skipped"}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-[#1a2f52] border border-[#254c8e] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-40"
              />
            </div>

            {/* Group filter */}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="bg-[#1a2f52] border border-[#254c8e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="All" className="bg-[#1a2f52]">All Categories</option>
              {allGroups.map((g) => (
                <option key={g} value={g} className="bg-[#1a2f52]">{formatName(g)}</option>
              ))}
            </select>

          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-[#1e3a6e]">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-widest font-medium cursor-pointer hover:text-cyan-400 transition-colors select-none"
                >
                  <span className="inline-flex items-center">
                    {col.label}
                    <SortIcon active={sortCol === col.key} direction={sortDir} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-slate-500 text-sm">
                  No items match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row, i) => (
                <tr
                  key={i}
                  className={`border-b border-[#1e3a6e]/40 table-row-hover transition-colors ${
                    i % 2 === 1 ? "table-row-even" : ""
                  } ${row.Predicted_Qty === 0 ? "opacity-40" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getPill(row["Item Group"], allGroups)}`}>
                      {formatName(row["Item Group"])}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-white text-sm font-medium min-w-[180px]">{formatName(row["Item Name"])}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${row.Predicted_Qty > 0 ? "text-white" : "text-slate-500"}`}>
                        {row.Predicted_Qty}
                      </span>
                      {row.Predicted_Qty > 0 && (
                        <div className="flex-1 max-w-[80px] h-1.5 bg-[#1e3a6e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${Math.min((row.Predicted_Qty / 30) * 100, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <ActionBadge action={row.Action} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#1e3a6e] flex items-center justify-between">
        <p className="text-slate-500 text-xs">
          Predictions generated by Random Forest model &middot; Powered by weather &amp; historical data
        </p>
        <p className="text-slate-600 text-xs">{filtered.length} rows</p>
      </div>
    </div>
  );
}
