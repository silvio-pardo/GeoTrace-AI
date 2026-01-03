import React from 'react';
import { Navigation, AlertTriangle, Flag, Clock, ArrowRight, CornerUpRight } from 'lucide-react';
import { formatDistance, formatTime } from '../utils/formatters';

export interface NavigationState {
  isActive: boolean;
  isOnTrack: boolean;
  distanceToRoute: number; // meters
  distanceToFinish: number; // meters
  estimatedDuration: number; // seconds
  distanceToNextTurn?: number; // meters
}

interface NavigationOverlayProps {
  navState: NavigationState;
  isVisible: boolean;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({ navState, isVisible }) => {
  if (!isVisible || !navState.isActive) return null;

  return (
    <div className="w-full max-w-md px-4 pointer-events-auto animate-in slide-in-from-bottom duration-500">
      <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border-2 overflow-hidden ${
        navState.isOnTrack 
          ? 'bg-emerald-900/80 border-emerald-500/50 text-white' 
          : 'bg-amber-900/80 border-amber-500/50 text-white'
      }`}>
        
        {/* Header Status */}
        <div className={`px-6 py-3 flex items-center justify-between border-b ${
           navState.isOnTrack ? 'bg-emerald-500/20 border-emerald-500/20' : 'bg-amber-500/20 border-amber-500/20'
        }`}>
          <div className="flex items-center gap-2.5">
            {navState.isOnTrack ? (
              <Navigation className="w-5 h-5 text-emerald-400 fill-current" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 fill-current" />
            )}
            <span className="font-black uppercase tracking-widest text-xs">
              {navState.isOnTrack ? 'On Course' : 'Off Track'}
            </span>
          </div>
          
          {!navState.isOnTrack && (
            <div className="flex items-center gap-1.5 text-amber-300">
              <span className="text-xs font-bold">
                {navState.distanceToRoute >= 1000 
                  ? formatDistance(navState.distanceToRoute) 
                  : `${navState.distanceToRoute.toFixed(0)} m`} off track
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Main Metrics */}
        <div className="p-5 flex items-center justify-between">
          
          {/* Next Turn (Only if On Track and detected) */}
          {navState.isOnTrack && navState.distanceToNextTurn !== undefined && (
             <>
               <div className="flex flex-col gap-1 flex-1 min-w-0">
                 <div className="flex items-center gap-1.5 text-white/60">
                   <CornerUpRight className="w-3.5 h-3.5" />
                   <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Next Turn</span>
                 </div>
                 <span className="text-2xl font-black tracking-tight tabular-nums truncate">
                   {navState.distanceToNextTurn >= 1000 
                     ? formatDistance(navState.distanceToNextTurn) 
                     : `${navState.distanceToNextTurn.toFixed(0)} m`}
                 </span>
               </div>
               <div className="w-[1px] h-10 bg-white/10 mx-4"></div>
             </>
          )}

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-white/60">
              <Flag className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Remaining</span>
            </div>
            <span className="text-2xl font-black tracking-tight tabular-nums truncate">
              {navState.distanceToFinish >= 1000 
                ? formatDistance(navState.distanceToFinish) 
                : `${navState.distanceToFinish.toFixed(0)} m`}
            </span>
          </div>

          <div className="w-[1px] h-10 bg-white/10 mx-4"></div>

          <div className="flex flex-col gap-1 items-end flex-1 min-w-0">
             <div className="flex items-center gap-1.5 text-white/60">
              <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Est. Time</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-black tracking-tight tabular-nums truncate">
              {navState.estimatedDuration > 0 ? formatTime(navState.estimatedDuration) : '--:--'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {navState.isOnTrack && (
           <div className="h-1 w-full bg-black/20">
             <div className="h-full bg-emerald-500 animate-pulse"></div>
           </div>
        )}
      </div>
    </div>
  );
};