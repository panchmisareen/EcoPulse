import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap, Flame, ArrowRight,
  Bike, Salad, Activity, Droplets, Trophy, Clock,
  Sparkles, Check, ArrowUpRight, TrendingUp, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import type { DashboardData, MissionCategory } from '../types';
import { Spinner } from '../components/ui';
import { timeAgo, getCategoryConfig } from '../utils';
import { useAuth } from '../hooks/useAuth';

export default function DashboardPage() {
  const { user, updatePoints } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const { data: d } = await api.get<DashboardData>('/dashboard');
        setData(d);
      } catch {
        setError('Could not connect to EcoPulse backend. Please verify server status.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshKey]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = data?.user?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Explorer';

  const handleCompleteMission = async (missionId: number) => {
    if (completed || completing) return;
    setCompleting(true);
    try {
      const res = await api.post(`/missions/${missionId}/complete`, {});
      setCompleted(true);
      
      const newTotal = res.data?.new_total_points ?? ((data?.total_points || 0) + (res.data?.points_awarded || 15));
      updatePoints(newTotal);

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_points: newTotal,
          weekly_stats: {
            ...prev.weekly_stats,
            missions_completed: prev.weekly_stats.missions_completed + 1,
            points_earned: prev.weekly_stats.points_earned + (res.data?.points_awarded || 15),
          },
        };
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00E575', '#FF5500', '#FFB800', '#15803D'],
      });
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setCompleted(true);
      }
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner className="w-8 h-8 text-[#15803D] mb-4 animate-spin" />
        <p className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Syncing Campus Telemetry…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card-studio p-10 text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Backend Connection Alert</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'Data is unavailable'}</p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="btn-capsule text-xs uppercase tracking-wider px-6 py-3"
        >
          Retry Handshake
        </button>
      </div>
    );
  }

  const rec = data.today_recommended_mission?.mission;
  const reason = data.today_recommended_mission?.reason;
  const config = rec ? getCategoryConfig(rec.category || 'travel') : null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Editorial Studio Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-widest uppercase text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              CAMPUS WELLNESS ACTIVE
            </span>
            <span className="text-xs text-slate-400 font-mono">✦ WEEK 08</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-slate-950 tracking-tight">
            {greeting}, <span className="italic font-serif font-normal text-slate-700">{displayName}</span>
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1.5">
            You've completed <span className="font-bold text-slate-900">{data.weekly_stats.missions_completed} missions</span> this week. High velocity momentum.
          </p>
        </div>

        {data.user?.is_demo && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-mono">
            <span className="font-bold">DEMO ENVIRONMENT</span>
            <span className="text-slate-400">·</span>
            <span>Seed Data Mode</span>
          </div>
        )}
      </div>

      {/* KINETIC BENTO GRID (4 Distinct High-Impact Cards inspired by Pin 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Velvety Noir Studio Card (Total Points) */}
        <div className="card-noir p-6 flex flex-col justify-between min-h-[190px] group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 font-bold uppercase flex items-center gap-1.5">
              <span>✦</span> TOTAL REWARD
            </span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-emerald-400">
              <Trophy size={16} />
            </div>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-display font-black text-white tracking-tight">
              {data.total_points.toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-emerald-400 font-semibold">+{data.weekly_stats.points_earned} pts this week</span>
            </div>
          </div>
          <div className="text-[11px] text-white/50 font-mono pt-2 border-t border-white/10 flex justify-between">
            <span>Next Tier: 1,000 pts</span>
            <span className="text-emerald-400">Top 10%</span>
          </div>
        </div>

        {/* Card 2: Kinetic Fire Streak Card (Headlight Motion Trail inspired) */}
        <div className="card-kinetic-fire p-6 flex flex-col justify-between min-h-[190px] group">
          {/* Background motion blur streak */}
          <div className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 w-36 h-28 bg-gradient-to-l from-orange-500/30 to-transparent blur-2xl" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-mono tracking-widest text-orange-400 font-bold uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" /> ACTIVE STREAK
            </span>
            <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center">
              <Flame size={18} className="fill-orange-400" />
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-display font-black text-white tracking-tight">
                {data.streak}
              </span>
              <span className="text-lg font-bold text-orange-300 font-mono">DAYS</span>
            </div>
            <p className="text-xs text-orange-200/80 font-medium mt-1">
              Streak shield active. Log 1 mission today.
            </p>
          </div>

          <div className="text-[11px] text-orange-300/70 font-mono pt-2 border-t border-orange-500/20 flex justify-between relative z-10">
            <span>Multiplier Active</span>
            <span className="text-orange-400 font-bold">1.25x PTS</span>
          </div>
        </div>

        {/* Card 3: Studio Alabaster (Weekly Missions) */}
        <div className="card-studio p-6 flex flex-col justify-between min-h-[190px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-slate-500 font-bold uppercase">
              WEEKLY TARGET
            </span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-display font-black text-slate-900 tracking-tight">
                {data.weekly_stats.missions_completed}
              </span>
              <span className="text-sm font-semibold text-slate-400 font-mono">/ 15 GOAL</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#111613] h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, Math.round((data.weekly_stats.missions_completed / 15) * 100))}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-100 flex justify-between">
            <span>{Math.round((data.weekly_stats.missions_completed / 15) * 100)}% Completed</span>
            <span className="text-slate-700 font-bold">4 Left</span>
          </div>
        </div>

        {/* Card 4: Impact Telemetry (CO2 & Commute) */}
        <div className="card-studio p-6 flex flex-col justify-between min-h-[190px] border-emerald-200/80 bg-gradient-to-br from-white via-white to-emerald-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-widest text-emerald-800 font-bold uppercase">
              CO₂ MITIGATED
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bike size={16} />
            </div>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-display font-black text-emerald-800 tracking-tight">
                {data.impact_summary.travel_km}
              </span>
              <span className="text-sm font-bold text-emerald-700 font-mono">KM</span>
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              {data.impact_summary.meal_swaps} plant swaps · {data.impact_summary.bottles_avoided} bottles saved
            </p>
          </div>

          <div className="text-[11px] text-emerald-800 font-mono pt-2 border-t border-emerald-100 flex justify-between">
            <span>Zero Emission Transport</span>
            <span className="font-bold">Verified</span>
          </div>
        </div>
      </div>

      {/* CENTERPIECE: TODAY'S CURATED MISSION */}
      {rec && (
        <div className="card-studio p-7 sm:p-9 relative overflow-hidden border-slate-200 shadow-md">
          <div className="pointer-events-none absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-100/60 rounded-full blur-3xl" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl space-y-3">
              {/* Pill tags */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className="px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase"
                  style={{ backgroundColor: config?.bgColor || '#DCFCE7', color: config?.textColor || '#166534' }}
                >
                  {config?.label || 'DAILY FOCUS'}
                </span>
                <span className="text-xs font-mono text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                  <Clock size={12} /> {rec.duration_minutes} MIN RUNTIME
                </span>
                <span className="text-xs font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  +{rec.points} POINTS
                </span>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight">
                {rec.title}
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                {rec.description}
              </p>

              {/* Reason quote */}
              {reason && (
                <div className="pt-2">
                  <span className="text-xs font-mono text-slate-500 italic bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 inline-block">
                    ✦ Coach Recommendation: {reason}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 flex-shrink-0">
              {completed ? (
                <div className="px-7 py-4 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md">
                  <Check size={18} />
                  <span>Mission Accomplished!</span>
                </div>
              ) : (
                <button
                  onClick={() => rec.id && handleCompleteMission(rec.id)}
                  disabled={completing}
                  className="btn-capsule-emerald text-sm uppercase font-extrabold tracking-wider px-8 py-4 shadow-lg flex items-center justify-center gap-3"
                >
                  {completing ? (
                    <Spinner className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Complete & Claim Points</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              )}

              <Link
                to="/app/coach"
                className="btn-capsule-ghost text-xs uppercase tracking-wider px-6 py-3 text-center"
              >
                Adaptive Coach Options
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* LOWER SECTION: RECENT TELEMETRY LOGS & HOSTEL PODIUM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Activity List */}
        <div className="lg:col-span-7 card-studio p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900 tracking-tight">Recent Activity Stream</h3>
              <p className="text-xs text-slate-500">Live verified completions by your profile</p>
            </div>
            <Link
              to="/app/missions"
              className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>EXPLORE ALL</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3.5">
            {data.recent_completions.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No missions logged yet today.</p>
            ) : (
              data.recent_completions.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F8F5] border border-slate-200/70 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-700 font-bold">
                      {comp.category === 'travel' ? <Bike size={18} /> :
                       comp.category === 'meals' ? <Salad size={18} /> :
                       comp.category === 'movement' ? <Activity size={18} /> : <Droplets size={18} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{comp.mission_title}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="capitalize">{comp.category}</span>
                        <span>·</span>
                        <span>{timeAgo(comp.completed_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-extrabold text-sm text-emerald-700">+{comp.points}</span>
                    <span className="text-[11px] text-slate-400 ml-0.5">pts</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Campus Hostel Podium Snippet */}
        <div className="lg:col-span-5 card-studio p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-display font-bold text-slate-900 tracking-tight">Leaderboard Pulse</h3>
              <p className="text-xs text-slate-500">Real-time student standings</p>
            </div>
            <Link
              to="/app/league"
              className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>FULL LEAGUE</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {data.leaderboard_preview.map((entry, idx) => (
              <div
                key={entry.username}
                className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                  entry.is_current_user
                    ? 'bg-[#111613] text-white shadow-md'
                    : 'bg-[#F8F8F5] text-slate-900 border border-slate-200/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full font-mono font-extrabold text-xs flex items-center justify-center ${
                      idx === 0 ? 'bg-amber-400 text-slate-950' :
                      idx === 1 ? 'bg-slate-300 text-slate-950' :
                      idx === 2 ? 'bg-amber-700 text-white' :
                      entry.is_current_user ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {entry.rank}
                  </span>
                  <div>
                    <span className={`font-bold text-sm block ${entry.is_current_user ? 'text-white' : 'text-slate-900'}`}>
                      {entry.username} {entry.is_current_user && '(You)'}
                    </span>
                    <span className={`text-[10px] font-mono ${entry.is_current_user ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {entry.is_demo ? 'Verified Student' : 'Active Member'}
                    </span>
                  </div>
                </div>

                <div className="font-mono text-sm font-black">
                  <span className={entry.is_current_user ? 'text-emerald-400' : 'text-slate-900'}>
                    {entry.total_points.toLocaleString()}
                  </span>
                  <span className={`text-[10px] ml-1 ${entry.is_current_user ? 'text-white/60' : 'text-slate-400'}`}>pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
