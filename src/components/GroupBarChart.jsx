"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLOR_PALETTE = [
  "#06b6d4", "#3b82f6", "#a855f7", "#10b981",
  "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6",
  "#14b8a6", "#f97316",
];

function getColor(group, allGroups) {
  const idx = allGroups.indexOf(group);
  return COLOR_PALETTE[idx >= 0 ? idx % COLOR_PALETTE.length : 0];
}

function formatName(raw) {
  return raw
    .replace(/\s*-\s*SNG\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2f52] border border-[#254c8e] rounded-lg px-4 py-3 shadow-xl">
        <p className="text-cyan-400 font-semibold text-sm mb-1">{label}</p>
        <p className="text-white text-sm">
          {payload[0].value} <span className="text-slate-400">units predicted</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function GroupBarChart({ predictions }) {
  const groups = [...new Set(predictions.map((p) => p["Item Group"]))].sort();
  const data = groups.map((g) => ({
    group: formatName(g),
    rawGroup: g,
    total: predictions
      .filter((p) => p["Item Group"] === g)
      .reduce((sum, p) => sum + p.Predicted_Qty, 0),
  }));

  return (
    <div className="bg-[#0f1f3d] border border-[#1e3a6e] rounded-xl p-5">
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-medium">
        Predicted Quantity by Category
      </p>
      <p className="text-white font-semibold mb-5">Today's Stock Breakdown</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e" vertical={false} />
          <XAxis
            dataKey="group"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(6,182,212,0.06)" }} />
          <Bar dataKey="total" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.rawGroup}
                fill={getColor(entry.rawGroup, groups)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center">
        {data.map((entry) => (
          <div key={entry.rawGroup} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ background: getColor(entry.rawGroup, groups) }}
            />
            <span className="text-slate-400 text-xs">{entry.group}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
