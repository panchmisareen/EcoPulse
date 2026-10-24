import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { MissionCategory } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPoints(points: number): string {
  if (points >= 1000) return `${(points / 1000).toFixed(1)}k`;
  return points.toString();
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(isoString);
}

export const categoryConfig: Record<MissionCategory, {
  label: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon: string;
  gradient: string;
}> = {
  travel: {
    label: 'Active Travel',
    color: '#26734D',
    bgColor: '#F0FDF4',
    textColor: '#166534',
    icon: 'bike',
    gradient: 'from-forest-800 to-forest-600',
  },
  meals: {
    label: 'Meal Swaps',
    color: '#65A30D',
    bgColor: '#F7FEE7',
    textColor: '#3F6212',
    icon: 'salad',
    gradient: 'from-lime-700 to-lime-500',
  },
  movement: {
    label: 'Movement',
    color: '#7C3AED',
    bgColor: '#FAF5FF',
    textColor: '#5B21B6',
    icon: 'activity',
    gradient: 'from-purple-800 to-purple-500',
  },
  hydration: {
    label: 'Hydration',
    color: '#2563EB',
    bgColor: '#EFF6FF',
    textColor: '#1D4ED8',
    icon: 'droplets',
    gradient: 'from-blue-700 to-blue-500',
  },
};

export function getCategoryConfig(category: string) {
  return categoryConfig[category as MissionCategory] || categoryConfig.travel;
}

export function getDifficultyConfig(difficulty: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    easy: { label: 'Easy', color: 'text-green-700', bg: 'bg-green-100' },
    medium: { label: 'Medium', color: 'text-amber-700', bg: 'bg-amber-100' },
    hard: { label: 'Hard', color: 'text-red-700', bg: 'bg-red-100' },
  };
  return map[difficulty] || map.easy;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function clampPercent(value: number, max: number): number {
  if (!max || max === 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}
