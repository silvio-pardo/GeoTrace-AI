import React from 'react';
import { TrendingUp, Mountain, Navigation } from 'lucide-react';

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
      className={`absolute left-0 right-0 px-4 sm:px-6 z-[1000] flex flex-col pointer-events-none transition-all duration-500 ${positionClass} ${isSidebarOpen ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}
    >
       <div className="w-full bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-xl border border-white/50 flex items-center justify-between gap-4 pointer-events-auto">
          
          {isRecording && (
            <div className="flex items-center justify-center pr-4 border-r border-slate-200/80 shrink-0">
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping absolute"></div>
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full relative"></div>
              </div>
            </div>
          )}

          <div className="flex-1 flex items-center justify-around">
            <div className="flex flex-col items-center min-w-[4rem]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Speed</span>
              </div>
              <span className="text-base font-black text-slate-800 tabular-nums whitespace-nowrap">
                {(speed * 3.6).toFixed(1)} <span className="text-[10px] text-slate-400 font-medium">km/h</span>
              </span>
            </div>
            
            <div className="w-[1px] h-8 bg-slate-200 mx-2"></div>
            
            <div className="flex flex-col items-center min-w-[4rem]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Mountain className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Altitude</span>
              </div>
              <span className="text-base font-black text-slate-800 tabular-nums whitespace-nowrap">
                {altitude.toFixed(0)} <span className="text-[10px] text-slate-400 font-medium">m</span>
              </span>
            </div>
            
            <div className="w-[1px] h-8 bg-slate-200 mx-2"></div>
            
            <div className="flex flex-col items-center min-w-[4rem]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Navigation className="w-3 h-3 text-indigo-500" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distance</span>
              </div>
              <span className="text-base font-black text-slate-800 tabular-nums whitespace-nowrap">
                {distance >= 1000 ? (distance / 1000).toFixed(2) : Math.round(distance)} <span className="text-[10px] text-slate-400 font-medium">{distance >= 1000 ? 'km' : 'm'}</span>
              </span>
            </div>
          </div>

       </div>
    </div>
  );
};