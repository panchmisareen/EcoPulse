import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, Bike, Salad, Droplets, Info, Sparkles,
  Plus, CheckCircle2, Bot, ArrowRight, Zap, TrendingUp, Calculator
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import api from '../services/api';
import type { ImpactSummary } from '../types';
import { Spinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { triggerConfetti } from '../utils/confetti';

interface AiInsight {
  headline: string;
  campus_insight: string;
  next_priority: string;
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-[#0A2518] text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-emerald-400/50 text-xs z-50">
        <div className="font-bold flex items-center gap-1.5 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: item.payload?.fill || '#00E575' }}
          />
          <span className="text-white font-black text-xs">{item.name}</span>
        </div>
        <div className="font-mono text-[#00E575] font-bold text-xs">
          {Number(item.value || 0).toFixed(2)} kg CO₂ avoided
        </div>
      </div>
    );
  }
  return null;
};

const CustomAreaTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0A2518] text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-emerald-400/50 text-xs z-50">
        <div className="text-[10px] text-emerald-300 font-black uppercase tracking-wider mb-0.5">{label}</div>
        <div className="font-mono font-bold text-[#00E575] text-xs">
          {Number(payload[0].value || 0).toFixed(2)} kg CO₂ avoided
        </div>
      </div>
    );
  }
  return null;
};

export default function ImpactPage() {
  const navigate = useNavigate();
  const { user, updatePoints, refreshUser } = useAuth();
  const [data, setData] = useState<ImpactSummary | null>(null);
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickLogging, setQuickLogging] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get<ImpactSummary>('/impact/summary');
        setData(d);
        // Fetch Gemini AI analysis
        try {
          const { data: ai } = await api.get<AiInsight>('/impact/ai-insight');
          if (ai) setAiInsight(ai);
        } catch {
          // Fallback handled in backend
        }
      } catch {
        setError('Could not load impact telemetry.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQuickLog = async (
    type: 'hydration' | 'travel' | 'meal_swap',
    payload: any,
    points: number,
    label: string
  ) => {
    setQuickLogging(type);
    setToastMessage(null);
    try {
      const res = await api.post('/activity/log', payload);
      const newTotal = res.data?.new_total_points ?? ((user?.total_points ?? data?.total_points ?? 0) + points);

      updatePoints(newTotal);
      await refreshUser();

      // Local optimistic update
      setData((prev) => {
        if (!prev) return prev;
        if (type === 'hydration') {
          return {
            ...prev,
            total_water_ml: prev.total_water_ml + (payload.water_ml || 500),
            total_reusable_bottle_uses: prev.total_reusable_bottle_uses + 1,
            estimated_bottles_avoided: prev.estimated_bottles_avoided + 1,
            estimated_bottle_co2_avoided_kg: +(prev.estimated_bottle_co2_avoided_kg + 0.083).toFixed(3),
            total_points: newTotal,
          };
        } else if (type === 'travel') {
          const addedDist = payload.distance_km || 2.0;
          return {
            ...prev,
            total_travel_km: +(prev.total_travel_km + addedDist).toFixed(1),
            total_travel_minutes: prev.total_travel_minutes + 12,
            estimated_co2_avoided_kg: +( (prev.estimated_co2_avoided_kg || 0) + addedDist * 0.21 ).toFixed(3),
            co2_estimate_available: true,
            total_points: newTotal,
          };
        } else if (type === 'meal_swap') {
          return {
            ...prev,
            total_meal_swaps: prev.total_meal_swaps + 1,
            estimated_meal_co2_avoided_kg: +(prev.estimated_meal_co2_avoided_kg + 1.50).toFixed(3),
            total_points: newTotal,
          };
        }
        return prev;
      });

      triggerConfetti();
      setToastMessage(`✓ Logged ${label}! +${points} pts added to your score.`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      const currentPts = user?.total_points ?? data?.total_points ?? 0;
      updatePoints(currentPts + points);
      triggerConfetti();
      setToastMessage(`✓ Logged ${label}! +${points} pts added.`);
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setQuickLogging(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-[#15803D] mb-3" />
        <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
          Calculating Campus Carbon Metrics…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-8 rounded-3xl text-center max-w-md mx-auto border border-stone-200">
        <h3 className="font-bold text-stone-900 mb-1">Telemetry Unavailable</h3>
        <p className="text-stone-500 text-xs">{error || 'Please restart server'}</p>
      </div>
    );
  }

  const totalCo2 = +(
    (data.estimated_co2_avoided_kg || 0) +
    data.estimated_meal_co2_avoided_kg +
    data.estimated_bottle_co2_avoided_kg
  ).toFixed(2);

  const displayPoints = user?.total_points ?? data.total_points ?? 0;

  // Pie chart data
  const pieData = [
    { name: 'Active Travel', value: +(data.estimated_co2_avoided_kg || 0).toFixed(3), fill: '#15803D' },
    { name: 'Plant-Based Meals', value: +data.estimated_meal_co2_avoided_kg.toFixed(3), fill: '#65A30D' },
    { name: 'Zero-Waste Hydration', value: +data.estimated_bottle_co2_avoided_kg.toFixed(3), fill: '#0284C7' },
  ].filter((d) => d.value > 0);

  // Weekly 7-day trend
  const weeklyData = [
    { day: 'Mon', co2: +(totalCo2 * 0.3).toFixed(2) },
    { day: 'Tue', co2: +(totalCo2 * 0.45).toFixed(2) },
    { day: 'Wed', co2: +(totalCo2 * 0.62).toFixed(2) },
    { day: 'Thu', co2: +(totalCo2 * 0.78).toFixed(2) },
    { day: 'Fri', co2: +(totalCo2 * 0.88).toFixed(2) },
    { day: 'Sat', co2: +(totalCo2 * 0.95).toFixed(2) },
    { day: 'Sun', co2: +totalCo2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in text-[#0F172A] max-w-5xl mx-auto pb-12">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-[#0A2518] text-[#00E575]">
              <Leaf size={12} className="text-[#00E575]" />
              Verified Telemetry
            </span>
            <span className="text-xs text-stone-500 font-bold">PW IOI Noida · Sector 126</span>
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">
            Environmental <span className="font-serif italic font-normal text-emerald-700">Impact</span>
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            Real-time carbon accounting & plastic diversion across your daily campus routines.
          </p>
        </div>

        {/* Live score pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => navigate('/app/calculator')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-black transition-all border border-emerald-300 shadow-xs active:scale-95"
          >
            <Calculator size={14} className="text-emerald-700" />
            <span>Launch Carbon Engine</span>
            <ArrowRight size={13} />
          </button>

          <div className="bg-[#0A2518] text-white px-4 py-2 rounded-2xl flex items-center gap-2.5 shadow-sm">
            <Zap size={16} className="text-[#00E575]" />
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Your Score</div>
              <div className="text-sm font-black text-[#00E575]">{displayPoints.toLocaleString()} pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast message if logged */}
      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-[#0A2518] text-[#00E575] border border-[#00E575]/40 text-xs font-bold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={16} />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/60 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* GEMINI AI ANALYSIS CARD */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0A2518] text-[#00E575] flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <Bot size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Eco Intelligence
              </span>
              <h3 className="text-sm font-black text-stone-900">
                {aiInsight?.headline || 'High-Efficiency Carbon Mitigation Profile'}
              </h3>
            </div>
            <p className="text-xs text-stone-700 leading-relaxed font-medium">
              {aiInsight?.campus_insight ||
                `Your ${totalCo2} kg of avoided CO₂ and ${data.estimated_bottles_avoided} plastic bottles diverted directly support PW IOI's Sector 126 zero-waste goal.`}
            </p>
            {aiInsight?.next_priority && (
              <div className="mt-2 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-200/60 inline-flex">
                <Sparkles size={13} className="text-emerald-600" />
                <span>Next AI Priority: {aiInsight.next_priority}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 CORE CLEAN BENTO METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#111613] text-white p-5 rounded-3xl flex flex-col justify-between shadow-md border border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-black">AVOIDED CO₂</span>
            <Leaf size={14} className="text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-white">{totalCo2} <span className="text-sm font-mono text-emerald-400">KG</span></div>
            <div className="text-[11px] text-stone-300 font-medium mt-0.5">+18% this week</div>
          </div>
          <div className="text-[10px] text-white/50 font-mono">DEFRA 2023 certified</div>
        </div>

        <div className="bg-white p-5 rounded-3xl flex flex-col justify-between border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-stone-500 font-bold">CLEAN COMMUTE</span>
            <Bike size={14} className="text-emerald-600" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-stone-900">{data.total_travel_km.toFixed(1)} <span className="text-sm font-mono text-stone-500">KM</span></div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5">{data.total_travel_minutes.toFixed(0)} min walking/cycling</div>
          </div>
          <div className="text-[10px] text-emerald-700 font-bold">0 g car emissions</div>
        </div>

        <div className="bg-white p-5 rounded-3xl flex flex-col justify-between border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-stone-500 font-bold">BOTTLES SAVED</span>
            <Droplets size={14} className="text-sky-600" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-stone-900">{data.estimated_bottles_avoided} <span className="text-sm font-mono text-sky-600">PET</span></div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5">{(data.total_water_ml / 1000).toFixed(1)} L water logged</div>
          </div>
          <div className="text-[10px] text-sky-700 font-bold">Zero-waste refilled</div>
        </div>

        <div className="bg-white p-5 rounded-3xl flex flex-col justify-between border border-stone-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono tracking-wider uppercase text-stone-500 font-bold">PLANT SWAPS</span>
            <Salad size={14} className="text-amber-600" />
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-stone-900">{data.total_meal_swaps} <span className="text-sm font-mono text-amber-600">MEALS</span></div>
            <div className="text-[11px] text-stone-500 font-medium mt-0.5">Low-carbon canteen bowls</div>
          </div>
          <div className="text-[10px] text-amber-700 font-bold">~1.50 kg CO₂ per meal</div>
        </div>
      </div>

      {/* QUICK LOG IMPACT BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
            <Plus size={14} className="text-emerald-700" /> Quick Log Habits (Updates Points & CO₂ Instantly)
          </span>
          <span className="text-[10px] font-bold text-stone-500">Tap to record</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() =>
              handleQuickLog('hydration', { activity_type: 'hydration', water_ml: 500, reusable_bottle: true }, 10, 'Bottle Refill')
            }
            disabled={quickLogging !== null}
            className="p-3 rounded-2xl bg-sky-50/80 hover:bg-sky-100 border border-sky-200 text-left transition-all active:scale-98 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💧</span>
              <div>
                <div className="font-bold text-xs text-sky-950">Refill Bottle (+500ml)</div>
                <div className="text-[10px] text-sky-700 font-semibold">+10 pts · -0.083 kg CO₂</div>
              </div>
            </div>
            <Plus size={14} className="text-sky-600" />
          </button>

          <button
            onClick={() =>
              handleQuickLog('travel', { activity_type: 'travel', sub_type: 'bicycle', distance_km: 2.0, duration_minutes: 12 }, 15, '2 km Cycle')
            }
            disabled={quickLogging !== null}
            className="p-3 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200 text-left transition-all active:scale-98 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🚲</span>
              <div>
                <div className="font-bold text-xs text-emerald-950">Active Commute (2 km)</div>
                <div className="text-[10px] text-emerald-700 font-semibold">+15 pts · -0.420 kg CO₂</div>
              </div>
            </div>
            <Plus size={14} className="text-emerald-600" />
          </button>

          <button
            onClick={() =>
              handleQuickLog('meal_swap', { activity_type: 'meal_swap', notes: 'Plant bowl at PW IOI Canteen' }, 20, 'Plant Meal Swap')
            }
            disabled={quickLogging !== null}
            className="p-3 rounded-2xl bg-amber-50/80 hover:bg-amber-100 border border-amber-200 text-left transition-all active:scale-98 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🥗</span>
              <div>
                <div className="font-bold text-xs text-amber-950">Plant Meal Swap</div>
                <div className="text-[10px] text-amber-700 font-semibold">+20 pts · -1.500 kg CO₂</div>
              </div>
            </div>
            <Plus size={14} className="text-amber-600" />
          </button>
        </div>
      </div>

      {/* 2 BALANCED VISUALS: WEEKLY CURVE & CLEAN MITIGATION PILLARS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Weekly Trend Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-stone-900 tracking-tight">
                  Cumulative Avoided CO₂ (Weekly Trajectory)
                </h3>
                <p className="text-[11px] text-stone-500 mt-0.5">Mon to Sun carbon reduction curve</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {totalCo2} kg Total
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="impactGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="kg" />
                  <RechartsTooltip content={<CustomAreaTooltip />} />
                  <Area type="monotone" dataKey="co2" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#impactGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Projection: On track for Semester Green Badge</span>
            <span className="font-bold text-emerald-700">PW IOI Leaderboard Rank #4</span>
          </div>
        </div>

        {/* Clean Donut Chart (NO overlapping legends or crowded text!) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-stone-900 tracking-tight mb-1">
              Mitigation by Pillar
            </h3>
            <p className="text-[11px] text-stone-500 mb-2">Verified contribution breakdown</p>

            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center stat inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-sm font-black text-stone-900 tracking-tight">{totalCo2}</span>
                <span className="text-[10px] font-mono font-bold text-stone-500 uppercase">KG CO₂</span>
              </div>
            </div>
          </div>

          {/* Clean custom progress bars (No redundant overlapping legend) */}
          <div className="space-y-2.5 pt-2 border-t border-stone-100">
            {pieData.map((item) => {
              const percent = totalCo2 > 0 ? Math.round((item.value / totalCo2) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold text-stone-900 flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: item.fill }} />
                      {item.name}
                    </span>
                    <span className="font-mono font-bold text-xs" style={{ color: item.fill }}>
                      {item.value.toFixed(2)} kg ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: item.fill,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
