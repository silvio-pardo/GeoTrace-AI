import React from 'react';
import { TrendingUp, Mountain, Navigation } from 'lucide-react';
import { formatDistance } from '../utils/formatters';

interface QuickMetricsOverlayProps {
  isVisible: boolean;
  positionClass: string;
  isRecording: boolean;
  speed: number;
  altitude: number;
  distance: number;
  isSidebarOpen: boolean;
}

export const QuickMetricsOverlay: React.FC<QuickMetricsOverlayProps> = ({
  isVisible,
  positionClass,
  isRecording,
  speed,
  altitude,
  distance,
  isSidebarOpen
}) => {
  if (!isVisible) return null;

  return (
    <div 
      className={`absolute left-6 z-[1000] flex flex-col gap-3 pointer-events-none transition-all duration-500 ${positionClass} ${isSidebarOpen ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}
    >
       <div className="bg-white/90 backdrop-blur-md px-5 py-4 rounded-3xl shadow-2xl border border-white/50 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {isRecording && (
              <>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute"></div>
                    <div className="w-2.5 h-2.5 bg-red-600 rounded-full relative"></div>
                  </div>
                </div>
                <div className="w-[1px] h-8 bg-slate-200"></div>
              </>
            )}

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Speed</span>
              </div>
              <span className="text-sm font-black text-slate-800 tabular-nums">
                {(speed * 3.6).toFixed(1)} <span className="text-[10px] text-slate-400 font-medium">km/h</span>
              </span>
            </div>
            <div className="w-[1px] h-8 bg-slate-200"></div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <Mountain className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Altitude</span>
              </div>
              <span className="text-sm font-black text-slate-800 tabular-nums">
                {altitude.toFixed(0)} <span className="text-[10px] text-slate-400 font-medium">m</span>
              </span>
            </div>
            <div className="w-[1px] h-8 bg-slate-200"></div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1">
                <Navigation className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distance</span>
              </div>
              <span className="text-sm font-black text-slate-800 tabular-nums">{formatDistance(distance)}</span>
            </div>
          </div>
       </div>
    </div>
  );
};