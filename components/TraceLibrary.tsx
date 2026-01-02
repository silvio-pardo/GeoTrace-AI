import React, { useRef } from 'react';
import { Library, Save, Upload, FileDown, Layers, Calendar, Trash2 } from 'lucide-react';
import { SavedTrace } from '../types';
import { formatDistance } from '../utils/formatters';

interface TraceLibraryProps {
  savedTraces: SavedTrace[];
  hasCoordinates: boolean;
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (isOpen: boolean) => void;
  traceName: string;
  setTraceName: (name: string) => void;
  onSaveTrace: () => void;
  onDeleteTrace: (id: string, e: React.MouseEvent) => void;
  onLoadTrace: (trace: SavedTrace) => void;
  onLoadReferenceTrace: (trace: SavedTrace, e: React.MouseEvent) => void;
  onImportGPX: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadReferenceLayer: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportGPX: () => void;
}

export const TraceLibrary: React.FC<TraceLibraryProps> = ({
  savedTraces,
  hasCoordinates,
  isSaveModalOpen,
  setIsSaveModalOpen,
  traceName,
  setTraceName,
  onSaveTrace,
  onDeleteTrace,
  onLoadTrace,
  onLoadReferenceTrace,
  onImportGPX,
  onLoadReferenceLayer,
  onExportGPX
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTraceInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="space-y-4">
       <div className="flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Library className="w-3.5 h-3.5" />
            Trace Library
          </h2>
          <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold">
            {savedTraces.length} Saved
          </div>
       </div>

       <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
          {/* Main Actions */}
          <div className="grid grid-cols-1 gap-2">
            {/* Save Button with Inline Form */}
            {!isSaveModalOpen ? (
               <button 
                onClick={() => setIsSaveModalOpen(true)}
                disabled={!hasCoordinates}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Save className="w-3.5 h-3.5" />
                 Save Current Trace
               </button>
            ) : (
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
                 <input 
                   type="text" 
                   value={traceName}
                   onChange={(e) => setTraceName(e.target.value)}
                   placeholder="Name your journey..."
                   className="w-full text-xs p-2.5 rounded-lg border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2 bg-white"
                   autoFocus
                 />
                 <div className="flex gap-2">
                    <button 
                      onClick={onSaveTrace}
                      disabled={!traceName.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button 
                      onClick={() => setIsSaveModalOpen(false)}
                      className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input type="file" accept=".gpx" className="hidden" ref={importTraceInputRef} onChange={onImportGPX} />
              <button 
                onClick={() => importTraceInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-slate-100"
              >
                <Upload className="w-3 h-3" />
                Import GPX
              </button>
              
              <button 
                onClick={onExportGPX}
                disabled={!hasCoordinates}
                className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-slate-100 disabled:opacity-50"
              >
                <FileDown className="w-3 h-3" />
                Export GPX
              </button>
            </div>

            <input type="file" accept=".gpx" className="hidden" ref={fileInputRef} onChange={onLoadReferenceLayer} />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 py-2 rounded-xl text-[10px] font-bold transition-all border border-dashed border-slate-200"
            >
              <Layers className="w-3 h-3" />
              Load Reference Layer
            </button>
          </div>
          
          {/* Saved List */}
          <div className="border-t border-slate-100 pt-3">
             <h3 className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-3">Saved Journeys</h3>
             {savedTraces.length === 0 ? (
               <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-[10px]">No saved traces yet.</p>
               </div>
             ) : (
               <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {savedTraces.map(trace => (
                    <div 
                      key={trace.id} 
                      onClick={() => onLoadTrace(trace)}
                      className="group flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-100 hover:border-blue-100 transition-all cursor-pointer"
                    >
                       <div className="flex flex-col gap-0.5 overflow-hidden">
                          <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-700 truncate">{trace.name}</span>
                          <div className="flex items-center gap-2 text-[9px] text-slate-400 group-hover:text-blue-400">
                             <span className="flex items-center gap-1">
                               <Calendar className="w-2.5 h-2.5" />
                               {new Date(trace.createdAt).toLocaleDateString()}
                             </span>
                             <span>•</span>
                             <span>{formatDistance(trace.stats.totalDistance)}</span>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => onLoadReferenceTrace(trace, e)}
                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                            title="Load as Reference Layer"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => onDeleteTrace(trace.id, e)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                            title="Delete Trace"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
       </div>
    </section>
  );
};