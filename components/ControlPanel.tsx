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
          className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-95"
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
          className="flex items-center justify-center gap-3 bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-bold transition-all"
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
                ? 'bg-purple-100 dark:bg-purple-900/20 text-purple-400 dark:text-purple-300 cursor-not-allowed'
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
      <div className="grid grid-cols-1 gap-3">
        {renderMainButton()}

        <div className="grid grid-cols-2 gap-3">
          <button 
            disabled={appState === AppState.RECORDING || appState === AppState.ANALYZING}
            onClick={onStartSimulation}
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Wind className="w-4 h-4" />
            Simulate
          </button>
          <button 
            onClick={onReset}
            className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </section>
  );
};