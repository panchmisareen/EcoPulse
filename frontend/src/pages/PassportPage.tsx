import React, { useEffect, useState } from 'react';
import { BookOpen, Flame, Trophy, Award, Bike, Salad, Activity, Droplets, Check, Lock } from 'lucide-react';
import api from '../services/api';
import type { PassportData } from '../types';
import { Spinner, AvatarCircle, DemoNotice, ProgressBar } from '../components/ui';
import { timeAgo, getCategoryConfig } from '../utils';

function BadgeCard({ badge, earned }: { badge: any; earned: boolean }) {
  return (
    <div className={`card p-4 text-center transition-all ${earned ? '' : 'opacity-50 grayscale'}`}>
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl ${
          earned ? 'shadow-eco' : 'bg-sage-light'
        }`}
        style={earned ? { backgroundColor: badge.badge.color + '30' } : {}}
      >
        {earned ? '🏆' : <Lock size={20} className="text-eco-muted" />}
      </div>
      <div className="font-bold text-sm text-eco-text">{badge.badge.name}</div>
      <div className="text-xs text-eco-muted mt-1">{badge.badge.description}</div>
      {earned && (
        <div className="text-xs text-eco-green mt-2 font-medium">
          {timeAgo(badge.earned_at)}
        </div>
      )}
    </div>
  );
}

function MilestoneRow({ milestone }: { milestone: any }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        milestone.achieved ? 'bg-eco-green' : 'bg-sage-light border-2 border-eco-border'
      }`}>
        {milestone.achieved ? (
          <Check size={12} className="text-white" />
        ) : (
          <Lock size={10} className="text-eco-muted" />
        )}
      </div>
      <div className="flex-1">
        <span className={`text-sm font-semibold ${milestone.achieved ? 'text-eco-text' : 'text-eco-muted'}`}>
          {milestone.name}
        </span>
      </div>
      <div className={`text-xs font-bold ${milestone.achieved ? 'text-eco-green' : 'text-eco-muted'}`}>
        {milestone.type === 'points' ? `${milestone.value} pts` :
         milestone.type === 'streak' ? `${milestone.value} days` :
         `${milestone.value} missions`}
      </div>
    </div>
  );
}

export default function PassportPage() {
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: d } = await api.get<PassportData>('/passport');
        setData(d);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-8 h-8 text-eco-green" />
    </div>
  );

  if (!data) return <div className="card p-8 text-center text-eco-muted">Could not load passport data.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-eco-green-dark">EcoPulse Passport</h1>
        <p className="text-eco-muted mt-1">Your personal achievement record.</p>
      </div>

      {data.user?.is_demo !== false && <DemoNotice />}

      {/* Profile card */}
      <div className="card p-6 bg-gradient-to-br from-forest-50 to-white border-forest-200">
        <div className="flex items-center gap-5 mb-6">
          <AvatarCircle
            name={data.user?.full_name || 'User'}
            color={data.user?.avatar_color || '#26734D'}
            size="lg"
          />
          <div>
            <h2 className="font-bold text-xl text-eco-text">{data.user?.full_name}</h2>
            <div className="text-eco-muted text-sm">@{data.user?.username}</div>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-black text-2xl text-eco-green">{data.total_points.toLocaleString()}</span>
              <span className="text-eco-muted text-sm">total points</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Missions', value: data.total_missions, icon: '🎯' },
            { label: 'Streak', value: `${data.current_streak}🔥`, icon: '⚡' },
            { label: 'Best Streak', value: `${data.longest_streak}d`, icon: '🏆' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-3 text-center border border-eco-border">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="font-black text-lg text-eco-text">{s.value}</div>
              <div className="text-xs text-eco-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Cumulative metrics */}
        <div className="card p-5">
          <h2 className="font-bold text-eco-text mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-eco-green" />
            Cumulative Activity
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Active Travel', value: `${data.cumulative_metrics.travel_km.toFixed(1)} km`, icon: '🚴', color: '#26734D' },
              { label: 'Movement Minutes', value: `${data.cumulative_metrics.movement_minutes.toFixed(0)} min`, icon: '⚡', color: '#7C3AED' },
              { label: 'Meal Swaps', value: `${data.cumulative_metrics.meal_swaps}`, icon: '🥗', color: '#65A30D' },
              { label: 'Water Logged', value: `${(data.cumulative_metrics.water_ml / 1000).toFixed(1)} L`, icon: '💧', color: '#2563EB' },
              { label: 'Reusable Bottle Uses', value: `${data.cumulative_metrics.reusable_bottle_uses}`, icon: '♻️', color: '#0891B2' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-eco-border last:border-0">
                <span className="text-sm text-eco-muted flex items-center gap-2">
                  {item.icon} {item.label}
                </span>
                <span className="font-bold text-sm" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly progress */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-eco-text mb-4">This Week</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-forest-50 rounded-xl p-4 text-center">
                <div className="font-black text-3xl text-eco-green">{data.weekly_progress.missions_this_week}</div>
                <div className="text-xs text-eco-muted">missions</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <div className="font-black text-3xl text-amber-500">{data.weekly_progress.points_this_week}</div>
                <div className="text-xs text-eco-muted">points</div>
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="card p-5">
            <h2 className="font-bold text-eco-text mb-3">Milestones</h2>
            <div className="divide-y divide-eco-border">
              {data.milestones.map((m) => (
                <MilestoneRow key={m.name} milestone={m} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="card p-5">
        <h2 className="font-bold text-eco-text mb-4 flex items-center gap-2">
          <Award size={16} className="text-amber-500" />
          Badges ({data.badges.length} earned)
        </h2>
        {data.badges.length === 0 ? (
          <div className="text-center py-8 text-eco-muted">
            <div className="text-4xl mb-3">🏅</div>
            <p className="text-sm">Complete missions to earn your first badge!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data.badges.map((ub) => (
              <BadgeCard key={ub.id} badge={ub} earned={true} />
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <h2 className="font-bold text-eco-text mb-4">Recent Activity</h2>
        {data.recent_activity.length === 0 ? (
          <p className="text-eco-muted text-sm text-center py-4">No activity yet. Complete missions to see history!</p>
        ) : (
          <div className="divide-y divide-eco-border">
            {data.recent_activity.map((item, i) => {
              const config = getCategoryConfig(item.category);
              return (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                    style={{ backgroundColor: config.bgColor }}
                  >
                    {item.category === 'travel' ? '🚴' :
                     item.category === 'meals' ? '🥗' :
                     item.category === 'movement' ? '⚡' : '💧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-eco-text truncate">{item.title}</div>
                    <div className="text-xs text-eco-muted">{timeAgo(item.completed_at)}</div>
                  </div>
                  <div className="font-bold text-sm text-eco-green">+{item.points} pts</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
