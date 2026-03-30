"use client";

function WeatherIcon({ icon, size = 8 }) {
  if (icon === "sunny") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`w-${size} h-${size} text-yellow-400`} stroke="currentColor" strokeWidth={1.8}>
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    );
  }
  if (icon === "rainy") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className={`w-${size} h-${size} text-blue-300`} stroke="currentColor" strokeWidth={1.8}>
        <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 15.25" />
        <line x1="8" y1="19" x2="8" y2="21" /><line x1="8" y1="13" x2="8" y2="15" />
        <line x1="16" y1="19" x2="16" y2="21" /><line x1="16" y1="13" x2="16" y2="15" />
        <line x1="12" y1="21" x2="12" y2="23" /><line x1="12" y1="15" x2="12" y2="17" />
      </svg>
    );
  }
  // cloudy
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`w-${size} h-${size} text-slate-300`} stroke="currentColor" strokeWidth={1.8}>
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  );
}

export default function WeatherPanel({ weather }) {
  if (!weather) {
    return (
      <div className="bg-[#0f1f3d] border border-[#1e3a6e] rounded-xl p-5 h-full flex items-center justify-center">
        <p className="text-slate-500 text-sm">No weather data available.</p>
      </div>
    );
  }

  const gradients = {
    sunny: "from-amber-500/10 via-transparent to-transparent",
    rainy: "from-blue-600/10 via-transparent to-transparent",
    cloudy: "from-slate-500/10 via-transparent to-transparent",
  };
  const gradient = gradients[weather.icon] || gradients.cloudy;

  return (
    <div className={`bg-[#0f1f3d] bg-gradient-to-br ${gradient} border border-[#1e3a6e] rounded-xl p-5 h-full flex flex-col`}>
      <p className="text-slate-400 text-xs uppercase tracking-widest mb-4 font-medium">Weather Conditions</p>

      {/* Main weather hero */}
      <div className="flex items-center gap-4 mb-5">
        <div className="p-2 rounded-xl bg-white/5">
          <WeatherIcon icon={weather.icon} size={12} />
        </div>
        <div>
          <p className="text-white text-4xl font-bold tracking-tight leading-none">{weather.temperature}°C</p>
          <p className="text-cyan-400 text-sm font-semibold mt-1">{weather.condition}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mt-auto">
        <div className="bg-[#1a2f52]/80 border border-[#254c8e]/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-blue-300" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z" />
            </svg>
            <p className="text-slate-400 text-xs">Rainfall</p>
          </div>
          <p className="text-white font-bold text-xl leading-none">{weather.rain}<span className="text-slate-400 text-xs font-normal ml-1">mm</span></p>
        </div>
        <div className="bg-[#1a2f52]/80 border border-[#254c8e]/50 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-teal-300" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <p className="text-slate-400 text-xs">Wind</p>
          </div>
          <p className="text-white font-bold text-xl leading-none">{weather.wind}<span className="text-slate-400 text-xs font-normal ml-1">km/h</span></p>
        </div>
      </div>
      <p className="text-slate-600 text-xs mt-3 text-center">Open-Meteo API</p>
    </div>
  );
}
