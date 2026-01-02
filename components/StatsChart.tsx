import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Coordinate } from '../types';

interface StatsChartProps {
  data: Coordinate[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const StatsChart: React.FC<StatsChartProps> = ({ data, isCollapsed, onToggleCollapse }) => {
  if (data.length < 2) return null;

  const chartData = data.map((pt, index) => ({
    time: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    speed: parseFloat(((pt.speed || 0) * 3.6).toFixed(1)),
    altitude: parseFloat((pt.alt || 0).toFixed(1))
  }));

  return (
    <div className="w-full flex flex-col transition-all duration-300">
      <div 
        className="flex items-center justify-between cursor-pointer group/header px-2 py-1"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCollapse();
        }}
      >
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover/header:text-blue-500 transition-colors">
          Journey Profiles
        </h3>
        <button 
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 group-hover/header:text-blue-500 transition-all active:scale-90"
          aria-label={isCollapsed ? "Expand Chart" : "Collapse Chart"}
        >
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="h-60 w-full animate-in fade-in slide-in-from-top-2 duration-300 mt-2 min-w-0">
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
              <XAxis 
                dataKey="time" 
                tick={{fontSize: 9}} 
                interval="preserveStartEnd"
                stroke="#94a3b8"
                hide={true}
              />
              <YAxis 
                yAxisId="left"
                tick={{fontSize: 9}} 
                stroke="#3b82f6"
                width={30}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{fontSize: 9}} 
                stroke="#10b981"
                width={30}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backdropFilter: 'blur(8px)' }}
                itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle" 
                iconSize={8} 
                wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em', top: -5 }} 
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="speed" 
                name="Speed (km/h)"
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSpeed)" 
                animationDuration={1500}
              />
              <Area 
                yAxisId="right"
                type="monotone" 
                dataKey="altitude" 
                name="Altitude (m)"
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorAlt)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};