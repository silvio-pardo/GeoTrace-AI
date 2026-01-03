import React from 'react';
import { Play, Square, Sparkles, Wind, Trash2 } from 'lucide-react';
import { AppState } from '../types';

interface ControlPanelProps {
  appState: AppState;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStartSimulation: () => void;
  onReset: () => void;
  onGenerateAnalysis: () => void;
  hasAnalysis: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  appState,
  onStartRecording,
  onStopRecording,
  onStartSimulation,
  onReset,
  onGenerateAnalysis,
  hasAnalysis
}) => {
  // Logic to determine main button
  const renderMainButton = () => {
    if (appState === AppState.RECORDING) {
      return (
        <button 
          onClick={onStopRecording}
          className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
        >
          <Square className="w-5 h-5 fill-current" />
          Finish Recording
        </button>
      );
    }

    if (appState === AppState.ANALYZING) {
      return (
        <button 
          disabled
          className="flex items-center justify-center gap-3 bg-slate-200 text-slate-400 py-4 rounded-2xl font-bold transition-all"
        >
          <Sparkles className="w-5 h-5 animate-spin" />
          Synthesizing Insights...
        </button>
      );
    }

    if (appState === AppState.VIEWING) {
       return (
         <button 
            onClick={onGenerateAnalysis}
            disabled={hasAnalysis}
            className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${
              hasAnalysis 
                ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            {hasAnalysis ? 'Insights Generated' : 'Generate AI Insights'}
          </button>
       );
    }

    // Default: IDLE or VIEWING with analysis already done (though the logic above handles VIEWING)
    return (
      <button 
        onClick={onStartRecording}
        className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
      >
        <Play className="w-5 h-5 fill-current" />
        Record New Trace
      </button>
    );
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Controls</h2>
      <div className="grid grid-cols-1 gap-3">
        {renderMainButton()}

        <div className="grid grid-cols-2 gap-3">
          <button 
            disabled={appState === AppState.RECORDING || appState === AppState.ANALYZING}
            onClick={onStartSimulation}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Wind className="w-4 h-4" />
            Simulate
          </button>
          <button 
            onClick={onReset}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};