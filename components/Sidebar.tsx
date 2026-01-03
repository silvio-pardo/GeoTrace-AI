import React from 'react';
import { Activity, Wifi, WifiOff, Maximize2 } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  isOnline: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, isOnline, onClose, children }) => {
  return (
    <aside className={`fixed md:relative z-[2000] h-full transition-all duration-300 ease-in-out shadow-2xl border-r border-slate-200 bg-white flex flex-col ${isOpen ? 'w-full md:w-[420px]' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden'}`}>
      
      <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden flex-shrink-0">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter">GEOTRACE AI</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${isOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
                {isOnline ? 'Online' : 'Offline'}
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/10"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
        {children}
      </div>
    </aside>
  );
};