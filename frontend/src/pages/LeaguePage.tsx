import React, { useEffect, useState } from 'react';
import { Trophy, Users, Medal, Flame, Target, Info } from 'lucide-react';
import api from '../services/api';
import type { LeaderboardEntry, TeamLeaderboardEntry } from '../types';
import { Spinner, AvatarCircle, DemoNotice, EmptyState } from '../components/ui';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="font-bold text-eco-muted text-sm">#{rank}</span>;
}

export default function LeaguePage() {
  const [individuals, setIndividuals] = useState<LeaderboardEntry[]>([]);
  const [teams, setTeams] = useState<TeamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'individual' | 'team'>('individual');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [ind, tm] = await Promise.all([
          api.get<LeaderboardEntry[]>('/leaderboard'),
          api.get<TeamLeaderboardEntry[]>('/leaderboard/teams'),
        ]);
        setIndividuals(ind.data);
        setTeams(tm.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const currentUser = individuals.find((e) => e.is_current_user);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-black text-2xl lg:text-3xl text-eco-green-dark">Campus Eco-Wellness League</h1>
        <p className="text-eco-muted mt-1">Rankings updated based on mission completions and streaks.</p>
      </div>

      <DemoNotice />

      {/* Scoring info */}
      <div className="card p-4 flex items-start gap-3 bg-forest-50 border-forest-200">
        <Info size={16} className="text-eco-green mt-0.5 flex-shrink-0" />
        <div className="text-sm text-eco-muted">
          <strong className="text-eco-text">How scoring works:</strong> Points are awarded once per eligible mission completion (server-enforced, 1-hour cooldown). Each category mission awards different points. Streaks do not directly inflate scores.
        </div>
      </div>

      {/* My rank card */}
      {currentUser && (
        <div className="card p-5 bg-gradient-to-r from-forest-50 to-white border-forest-200">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-black text-eco-green">
              {currentUser.rank <= 3 ? <RankIcon rank={currentUser.rank} /> : `#${currentUser.rank}`}
            </div>
            <AvatarCircle name={currentUser.full_name} color={currentUser.avatar_color} size="lg" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-eco-text">{currentUser.full_name}</span>
                <span className="badge-green text-[10px]">You</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-eco-muted">
                <span className="font-bold text-eco-green">{currentUser.total_points.toLocaleString()} pts</span>
                <span>{currentUser.missions_completed} missions</span>
                <span>{currentUser.current_streak}🔥 streak</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-amber-500">⭐ × {currentUser.badges_count}</div>
              <div className="text-xs text-eco-muted">badges</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab */}
      <div className="flex bg-sage-light rounded-xl p-1">
        {(['individual', 'team'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              tab === t ? 'bg-white text-eco-text shadow-sm' : 'text-eco-muted'
            }`}
          >
            {t === 'individual' ? <><Trophy size={15} /> Individual</> : <><Users size={15} /> Teams</>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Spinner className="w-8 h-8 text-eco-green" />
        </div>
      ) : tab === 'individual' ? (
        <>
          {individuals.length === 0 ? (
            <EmptyState icon={Trophy} title="No rankings yet" description="Complete missions to appear on the leaderboard." />
          ) : (
            <div className="card divide-y divide-eco-border">
              {individuals.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 p-4 transition-colors ${
                    entry.is_current_user ? 'bg-forest-50' : 'hover:bg-sage-light/30'
                  }`}
                >
                  <div className="w-10 flex-shrink-0 text-center">
                    <RankIcon rank={entry.rank} />
                  </div>
                  <AvatarCircle name={entry.full_name} color={entry.avatar_color} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-eco-text truncate">{entry.full_name}</span>
                      {entry.is_demo && <span className="badge bg-amber-100 text-amber-700 text-[10px]">demo</span>}
                      {entry.is_current_user && <span className="badge-green text-[10px]">you</span>}
                    </div>
                    <div className="text-xs text-eco-muted flex items-center gap-3">
                      <span>@{entry.username}</span>
                      <span>{entry.missions_completed} missions</span>
                      <span className="flex items-center gap-0.5">
                        <Flame size={11} className="text-orange-400" /> {entry.current_streak}d
                      </span>
                      {entry.badges_count > 0 && <span>⭐ × {entry.badges_count}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-lg text-eco-green">{entry.total_points.toLocaleString()}</div>
                    <div className="text-xs text-eco-muted">pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {teams.length === 0 ? (
            <EmptyState icon={Users} title="No team rankings yet" description="Teams are formed and ranked automatically." />
          ) : (
            <div className="card divide-y divide-eco-border">
              {teams.map((team) => (
                <div key={team.team_id} className="flex items-center gap-4 p-4 hover:bg-sage-light/30 transition-colors">
                  <div className="w-10 flex-shrink-0 text-center">
                    <RankIcon rank={team.rank} />
                  </div>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 text-sm"
                    style={{ backgroundColor: team.avatar_color }}
                  >
                    {team.team_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-eco-text truncate">{team.team_name}</span>
                      {team.is_demo && <span className="badge bg-amber-100 text-amber-700 text-[10px]">demo</span>}
                    </div>
                    <div className="text-xs text-eco-muted flex items-center gap-3">
                      <span className="capitalize">{team.team_type}</span>
                      <span className="flex items-center gap-0.5"><Users size={11} /> {team.member_count} members</span>
                      <span>{team.missions_completed} missions</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-lg text-eco-green">{team.total_points.toLocaleString()}</div>
                    <div className="text-xs text-eco-muted">combined pts</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-center text-xs text-eco-muted">
        Demo data is labelled. Real scores reflect actual mission completions.
      </p>
    </div>
  );
}
