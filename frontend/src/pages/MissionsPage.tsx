import React, { useEffect, useState } from 'react';
import {
  Filter, CheckCircle2, Clock, ChevronDown, ChevronUp,
  Bike, Salad, Activity, Droplets, Target, Search, X, Sparkles, Zap
} from 'lucide-react';
import api from '../services/api';
import type { Mission, MissionCategory } from '../types';
import { Spinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { triggerConfetti } from '../utils/confetti';

const CATEGORIES: { value: MissionCategory | ''; label: string; icon: typeof Bike; emoji: string }[] = [
  { value: '', label: 'All Missions', icon: Target, emoji: '🎯' },
  { value: 'travel', label: 'Active Travel', icon: Bike, emoji: '🚴' },
  { value: 'meals', label: 'Meal Swaps', icon: Salad, emoji: '🥗' },
  { value: 'movement', label: 'Micro-Breaks', icon: Activity, emoji: '⚡' },
  { value: 'hydration', label: 'Hydration', icon: Droplets, emoji: '💧' },
];

function MissionCard({
  mission,
  onComplete,
}: {
  mission: Mission;
  onComplete: (id: number, points: number, newTotal?: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  const handleComplete = async () => {
    if (completing || completed) return;
    setCompleting(true);
    setError('');
    try {
      const res = await api.post(`/missions/${mission.id}/complete`, {});
      setCompleted(true);
      const points = res.data?.points_awarded || res.data?.points_earned || mission.points || 15;
      const newTotal = res.data?.new_total_points;
      onComplete(mission.id, points, newTotal);
      triggerConfetti();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setCompleted(true);
      } else {
        setError(err?.response?.data?.detail || 'Could not complete mission.');
      }
    } finally {
      setCompleting(false);
    }
  };

  const difficultyMeta: Record<string, { label: string; color: string }> = {
    easy: { label: 'Easy', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    medium: { label: 'Medium', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    hard: { label: 'Challenging', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  };

  const diff = difficultyMeta[mission.difficulty] || difficultyMeta.easy;

  return (
    <div className={`card-studio p-5 rounded-3xl transition-all duration-200 ${completed ? 'opacity-80 bg-stone-50/60' : 'hover:shadow-md'}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-2xl bg-stone-100 flex items-center justify-center text-lg flex-shrink-0">
            {mission.category === 'travel' ? '🚴' :
             mission.category === 'meals' ? '🥗' :
             mission.category === 'movement' ? '⚡' : '💧'}
          </span>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-stone-600 block">
              {mission.category}
            </span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${diff.color}`}>
              {diff.label}
            </span>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xl font-black text-[#0A2518]">+{mission.points}</div>
          <div className="text-[10px] text-stone-600 font-bold uppercase tracking-wider">PTS</div>
        </div>
      </div>

      <h3 className="font-black text-stone-900 text-base tracking-tight mb-1.5 leading-snug">
        {mission.title}
      </h3>
      <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-2">
        {mission.description}
      </p>

      {/* Expanded instructions */}
      {expanded && (
        <div className="mb-4 pt-3 border-t border-stone-100 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-stone-600">Step by step:</div>
          <div className="space-y-1.5">
            {mission.instructions.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-stone-700">
                <span className="w-4 h-4 rounded-full bg-[#0A2518] text-[#00E575] text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
        {completed ? (
          <div className="flex-1 py-2.5 px-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full font-bold text-xs flex items-center justify-center gap-1.5">
            <CheckCircle2 size={14} />
            <span>Completed!</span>
          </div>
        ) : (
          <button
            onClick={handleComplete}
            disabled={completing}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#0A2518] text-[#00E575] hover:bg-stone-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-98"
          >
            {completing ? (
              <Spinner className="w-3.5 h-3.5 text-[#00E575]" />
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Complete Mission</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2.5 rounded-full border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
          title={expanded ? 'Collapse steps' : 'Expand steps'}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
    </div>
  );
}

export default function MissionsPage() {
  const { user, updatePoints } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MissionCategory | ''>('');
  const [search, setSearch] = useState('');
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchMissions = async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (selectedCategory) params.category = selectedCategory;
        const { data } = await api.get<Mission[]>('/missions', { params });
        setMissions(data);
      } catch {
        setError('Could not load missions catalog.');
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, [selectedCategory]);

  const handleMissionComplete = (id: number, points: number, newTotal?: number) => {
    setCompletedIds((prev) => new Set([...prev, id]));
    updatePoints(newTotal ?? ((user?.total_points ?? user?.points ?? 0) + points));
  };

  const filteredMissions = missions.filter((m) => {
    const matchesSearch = !search ||
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#0A2518] text-[#00E575]">
              <Target size={12} className="text-[#00E575]" />
              Missions Catalog
            </span>
            <span className="text-xs text-stone-600">Daily Student Impact Playbook</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-stone-900 tracking-tight">
            Action <span className="font-serif italic font-normal text-stone-500">Directory</span>
          </h1>
          <p className="text-stone-600 text-sm mt-1 max-w-xl">
            Choose from science-backed micro-habits covering active commute, clean dining swaps, study desk mobility, and zero-waste hydration.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600" />
          <input
            type="text"
            placeholder="Search missions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-stone-200/90 rounded-full focus:outline-none focus:ring-2 focus:ring-[#0A2518]"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? 'bg-[#0A2518] text-white shadow-md'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200/80 shadow-xs'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Missions */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner className="w-8 h-8 text-[#0A2518]" />
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="card-studio p-12 text-center rounded-3xl">
          <p className="text-stone-600 text-sm">No missions match your selected filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onComplete={handleMissionComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
