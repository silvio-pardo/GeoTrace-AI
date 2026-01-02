import React from 'react';
import { MapPin, History, Activity, Layers } from 'lucide-react';
import { TraceStats } from '../types';
import { formatDistance, formatTime } from '../utils/formatters';

interface MetricsPanelProps {
  stats: TraceStats;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ stats }) => {
  return (
    <section className="space-y-4">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Journey Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
         {[
           { label: 'Distance', value: formatDistance(stats.totalDistance), icon: MapPin },
           { label: 'Time', value: formatTime(stats.duration), icon: History },
           { label: 'Avg Speed', value: `${stats.avgSpeed} km/h`, icon: Activity },
           { label: 'Gain', value: `${stats.elevationGain} m`, icon: Layers }
         ].map((item, idx) => (
           <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
             <div className="flex items-center gap-2 mb-2">
               <item.icon className="w-3 h-3 text-slate-400" />
               <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{item.label}</span>
             </div>
             <div className="text-lg font-black text-slate-800 tabular-nums">
               {item.value}
             </div>
           </div>
         ))}
      </div>
    </section>
  );
};