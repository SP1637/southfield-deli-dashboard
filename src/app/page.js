"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import WeatherPanel from "../components/WeatherPanel";
import StatsRow from "../components/StatsRow";
import GroupBarChart from "../components/GroupBarChart";
import TrendChart from "../components/TrendChart";
import PredictionTable from "../components/PredictionTable";

// ─────────────────────────────────────────────────────────────
// CONFIGURATION — swap these two lines once you have real data
// ─────────────────────────────────────────────────────────────

// OPTION A: Use simulated local data (default, works offline)
const DATA_SOURCE = "sheets";

// OPTION B: Paste your published Google Sheet CSV URL below,
// then change DATA_SOURCE above to "sheets"
const SHEETS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIFWj44wiT1yJggDNd7GOfS-BgIL9jilZB2okfo72s0yEDgT8GU-M6ZNq_IntZcmGVi-gaHegFTIdA/pub?gid=640455432&single=true&output=csv";

// ─────────────────────────────────────────────────────────────

// Parse DD/MM/YYYY (Google Sheets output) → YYYY-MM-DD (dashboard internal)
function parseSheetDate(raw) {
  if (!raw) return "";
  const trimmed = raw.trim().replace(/"/g, "");
  // already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // DD/MM/YYYY
  const m = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return trimmed;
}

function parseCsv(csvText) {
  const lines = csvText.trim().split("\n");
  // skip header row
  return lines.slice(1).map((line) => {
    // handle quoted fields (Google Sheets wraps some fields in quotes)
    const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
    const clean = (s) => (s || "").replace(/^"|"$/g, "").trim();
    return {
      Date:          parseSheetDate(clean(cols[0])),
      "Item Group":  clean(cols[1]),
      "Item Name":   clean(cols[2]),
      Predicted_Qty: parseInt(clean(cols[3]), 10) || 0,
      Action:        clean(cols[4]),
    };
  }).filter((r) => r.Date && r["Item Name"]);
}

async function fetchWeatherForDate(dateStr) {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=52.5736&longitude=-0.2478` +
      `&daily=weather_code,temperature_2m_max,precipitation_sum,wind_speed_10m_max` +
      `&timezone=Europe%2FLondon`
    );
    const data = await res.json();
    const idx  = data.daily.time.indexOf(dateStr);
    if (idx === -1) return null;
    const code = data.daily.weather_code[idx];
    const icon = code === 0 ? "sunny" : code <= 3 ? "cloudy" : "rainy";
    const conditions = {
      0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
      61: "Light Rain", 63: "Moderate Rain", 65: "Heavy Rain",
      80: "Rain Showers", 95: "Thunderstorm",
    };
    return {
      temperature: Math.round(data.daily.temperature_2m_max[idx]),
      rain:        data.daily.precipitation_sum[idx] ?? 0,
      wind:        Math.round(data.daily.wind_speed_10m_max[idx]),
      condition:   conditions[code] ?? "Cloudy",
      icon,
    };
  } catch {
    return null;
  }
}

export default function Dashboard() {
  const [allPredictions, setAllPredictions] = useState([]);
  const [weatherData,    setWeatherData]    = useState({});
  const [selectedDate,   setSelectedDate]   = useState("");
  const [loading,        setLoading]        = useState(true);
  const [dataError,      setDataError]      = useState(false);

  // Load predictions
  useEffect(() => {
    async function load() {
      try {
        let preds = [];

        if (DATA_SOURCE === "sheets") {
          try {
            const res  = await fetch(SHEETS_CSV_URL);
            const text = await res.text();
            preds = parseCsv(text);
          } catch {
            // network unavailable — fall back to local data
            const res = await fetch("/data/predictions.json");
            preds = await res.json();
          }
        } else {
          const res = await fetch("/data/predictions.json");
          preds = await res.json();
        }

        setAllPredictions(preds);

        // set selected date to today or most recent available date
        const today  = new Date().toISOString().slice(0, 10);
        const dates  = [...new Set(preds.map((p) => p.Date))].sort();
        const picked = dates.includes(today) ? today : dates[dates.length - 1] ?? today;
        setSelectedDate(picked);

        // fetch live weather for all available dates
        const weatherMap = {};
        // fetch local fallback weather first
        const localWeatherRes = await fetch("/data/weather.json");
        const localWeather    = await localWeatherRes.json();
        Object.assign(weatherMap, localWeather);

        // try to fetch live weather for selected date
        const liveWeather = await fetchWeatherForDate(picked);
        if (liveWeather) weatherMap[picked] = liveWeather;

        setWeatherData(weatherMap);
      } catch (err) {
        console.error("Failed to load predictions:", err);
        setDataError(true);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const dates = useMemo(
    () => [...new Set(allPredictions.map((p) => p.Date))].sort(),
    [allPredictions]
  );

  const todayPredictions = useMemo(
    () => allPredictions.filter((p) => p.Date === selectedDate),
    [allPredictions, selectedDate]
  );

  const allGroups = useMemo(
    () => [...new Set(allPredictions.map((p) => p["Item Group"]))].sort(),
    [allPredictions]
  );

  const weather = weatherData[selectedDate] || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading predictions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      <Header selectedDate={selectedDate} dates={dates} onDateChange={setSelectedDate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Page title */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-white text-xl font-semibold">
              What should I prepare today?
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              ML predictions based on today's weather and historical sales patterns.
            </p>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/25 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Predictions Ready
          </span>
        </div>

        {/* Top row: Weather + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <WeatherPanel weather={weather} />
          </div>
          <div className="lg:col-span-3">
            <StatsRow predictions={todayPredictions} />
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GroupBarChart predictions={todayPredictions} />
          <TrendChart allPredictions={allPredictions} selectedDate={selectedDate} />
        </div>

        {/* Preparation table */}
        <PredictionTable predictions={todayPredictions} allGroups={allGroups} />

        {/* Footer */}
        <footer className="text-center py-4 text-slate-600 text-xs border-t border-[#1e3a6e]">
          Southfield Deli &mdash; Weather-Driven Retail Sales Prediction &bull; Final Year Project &bull; Data source: Open-Meteo API &amp; Historical Sales
        </footer>
      </main>
    </div>
  );
}
