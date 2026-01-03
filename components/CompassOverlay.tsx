import React from 'react';

interface CompassOverlayProps {
  heading: number;
  className?: string;
}

export const CompassOverlay: React.FC<CompassOverlayProps> = ({ heading, className }) => (
  <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full shadow-xl border border-white/50 dark:border-slate-700/50 transition-all duration-300 pointer-events-auto flex items-center justify-center w-14 h-14 ${className}`}>
      <div style={{ transform: `rotate(${-heading}deg)`, transition: 'transform 0.3s ease-out' }} className="relative w-6 h-6 flex items-center justify-center">
         {/* Compass Face */}
         <div className="absolute inset-0 rounded-full border-[1.5px] border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"></div>
         
         {/* Cardinal Points */}
         <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-black text-black dark:text-white leading-none">N</span>
         <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-800 dark:text-slate-300 leading-none">S</span>
         <span className="absolute top-1/2 -right-3 -translate-y-1/2 text-[8px] font-bold text-slate-800 dark:text-slate-300 leading-none">E</span>
         <span className="absolute top-1/2 -left-3 -translate-y-1/2 text-[8px] font-bold text-slate-800 dark:text-slate-300 leading-none">W</span>

         {/* North Marker */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-2 bg-red-600 rounded-full -translate-y-0.5 shadow-sm ring-1 ring-white/50 dark:ring-slate-900/50"></div>
         
         {/* South Marker */}
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[3px] h-2 bg-slate-400 dark:bg-slate-500 rounded-full translate-y-0.5 shadow-sm ring-1 ring-white/50 dark:ring-slate-900/50"></div>
         
         {/* Center */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-slate-900 dark:bg-slate-100 rounded-full z-10 border border-white dark:border-slate-900 shadow-sm"></div>
      </div>
  </div>
);