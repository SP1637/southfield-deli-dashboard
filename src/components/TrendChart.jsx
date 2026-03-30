"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  defs,
  linearGradient,
  stop,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a2f52] border border-[#254c8e] rounded-lg px-4 py-3 shadow-xl">
        <p className="text-cyan-400 font-semibold text-sm mb-1">{label}</p>
        <p className="text-white text-sm">
          {payload[0].value} <span className="text-slate-400">total units</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function TrendChart({ allPredictions, selectedDate }) {
  const dates = [...new Set(allPredictions.map((p) => p.Date))].sort();
  const data = dates.map((d) => ({
    date: new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric", month: "short",
    }),
    rawDate: d,
    total: allPredictions
      .filter((p) => p.Date === d)
      .reduce((sum, p) => sum + p.Predicted_Qty, 0),
  }));

  const totals = data.map((d) => d.total);
  const minVal = Math.min(...totals);
  const maxVal = Math.max(...totals);
  const padding = Math.max(10, Math.round((maxVal - minVal) * 0.3));
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;

  const selectedLabel = data.find((d) => d.rawDate === selectedDate)?.date;

  return (
    <div className="bg-[#0f1f3d] border border-[#1e3a6e] rounded-xl p-5">
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-1 font-medium">
        Daily Trend
      </p>
      <p className="text-white font-semibold mb-5">Total Predicted Units Over Time</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#94a3b8", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={35}
            domain={[yMin, yMax]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#254c8e" }} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#06b6d4"
            strokeWidth={2.5}
            fill="url(#trendGradient)"
            dot={{ fill: "#06b6d4", r: 4, strokeWidth: 0 }}
            activeDot={{ fill: "#22d3ee", r: 6, strokeWidth: 0 }}
          />
          {selectedLabel && (
            <ReferenceDot
              x={selectedLabel}
              y={data.find((d) => d.date === selectedLabel)?.total}
              r={6}
              fill="#22d3ee"
              stroke="#0a1628"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <p className="text-slate-500 text-xs text-center mt-2">Based on ML model predictions</p>
    </div>
  );
}
