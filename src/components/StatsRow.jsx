"use client";

function StatCard({ label, value, sub, accent, iconBg, icon }) {
  return (
    <div className={`bg-[#0f1f3d] border border-[#1e3a6e] rounded-xl p-5 flex items-center gap-4 border-t-2 ${accent}`}>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-widest font-medium">{label}</p>
        <p className="text-white text-2xl font-bold leading-tight">{value}</p>
        {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function StatsRow({ predictions }) {
  const totalQty = predictions.reduce((sum, p) => sum + p.Predicted_Qty, 0);
  const toPrep = predictions.filter((p) => p.Predicted_Qty > 0).length;
  const skip = predictions.filter((p) => p.Predicted_Qty === 0).length;
  const groups = [...new Set(predictions.map((p) => p["Item Group"]))].length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Items to Prepare"
        value={totalQty}
        sub="units across all categories"
        accent="border-t-cyan-500"
        iconBg="bg-cyan-500/20"
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-cyan-400" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
      />
      <StatCard
        label="Products to Prepare"
        value={toPrep}
        sub={`out of ${predictions.length} products`}
        accent="border-t-green-500"
        iconBg="bg-green-500/20"
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-green-400" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        }
      />
      <StatCard
        label="Items to Skip"
        value={skip}
        sub="predicted demand: zero"
        accent="border-t-red-500"
        iconBg="bg-red-500/20"
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-red-400" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        }
      />
      <StatCard
        label="Categories Active"
        value={groups}
        sub="product groups with stock"
        accent="border-t-purple-500"
        iconBg="bg-purple-500/20"
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-purple-400" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
          </svg>
        }
      />
    </div>
  );
}
