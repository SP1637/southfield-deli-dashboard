"use client";

export default function Header({ selectedDate, dates, onDateChange }) {
  const formatted = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <header className="bg-[#0c1a35]/95 backdrop-blur-sm border-b border-[#1e3a6e]/80 px-6 py-4 sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight tracking-tight">Southfield Deli</h1>
            <p className="text-slate-400 text-xs tracking-wide">Sales Prediction Dashboard</p>
          </div>
        </div>

        {/* Date picker + current date display */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-slate-500 text-xs uppercase tracking-widest">Showing predictions for</p>
            <p className="text-cyan-400 text-sm font-semibold">{formatted}</p>
          </div>
          <div className="flex items-center gap-2 bg-[#1a2f52] border border-[#254c8e] hover:border-cyan-500/50 transition-colors rounded-xl px-3 py-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-cyan-400 flex-shrink-0" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <select
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
            >
              {dates.map((d) => (
                <option key={d} value={d} className="bg-[#1a2f52]">
                  {new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
                    weekday: "short", day: "numeric", month: "short",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
