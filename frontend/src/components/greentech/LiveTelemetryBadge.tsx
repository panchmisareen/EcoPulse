import { Activity } from 'lucide-react';

interface LiveTelemetryBadgeProps {
  label?: string;
  statusText?: string;
  metric?: string;
}

export default function LiveTelemetryBadge({
  label = 'LIVE GRID',
  statusText = 'CAMPUS WELLNESS ACTIVE',
  metric = '99.4%',
}: LiveTelemetryBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#08120B]/90 border border-emerald-500/30 backdrop-blur-md shadow-lg shadow-emerald-950/40">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF87] shadow-[0_0_8px_#00FF87]"></span>
      </span>
      <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-400/90 font-bold">
        {label}
      </span>
      <span className="w-1 h-1 rounded-full bg-emerald-500/40" />
      <span className="text-xs text-emerald-100/90 font-medium tracking-wide">
        {statusText}
      </span>
      {metric && (
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-[#00FF87] border border-emerald-500/30">
          {metric}
        </span>
      )}
      <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
    </div>
  );
}
