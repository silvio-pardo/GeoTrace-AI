import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Square, 
  MapPin, 
  Activity, 
  Sparkles, 
  Navigation,
  Trash2,
  Wind,
  Layers,
  History,
  Maximize2,
  Upload,
  Download,
  FileDown,
  FileUp,
  TrendingUp,
  Mountain,
  Wifi,
  WifiOff,
  DownloadCloud,
  HardDrive,
  X,
  Save,
  Calendar,
  ChevronRight,
  Library,
  AlertTriangle
} from 'lucide-react';
import { TraceMap } from './components/TraceMap';
import { StatsChart } from './components/StatsChart';
import { analyzeTrace } from './services/geminiService';
import { offlineMapService } from './services/offlineMapService';
import { traceStorageService } from './services/traceStorageService';
import { Coordinate, TraceStats, AppState, AIAnalysis, SavedTrace } from './types';

const INITIAL_DEMO_TRACE: Coordinate[] = [
  { lat: 37.7749, lng: -122.4194, timestamp: Date.now() - 600000, speed: 2.5, alt: 10 },
  { lat: 37.7758, lng: -122.4205, timestamp: Date.now() - 500000, speed: 3.2, alt: 12 },
  { lat: 37.7765, lng: -122.4220, timestamp: Date.now() - 400000, speed: 4.1, alt: 15 },
  { lat: 37.7772, lng: -122.4238, timestamp: Date.now() - 300000, speed: 3.8, alt: 14 },
  { lat: 37.7785, lng: -122.4255, timestamp: Date.now() - 200000, speed: 5.2, alt: 18 },
  { lat: 37.7798, lng: -122.4278, timestamp: Date.now() - 100000, speed: 4.5, alt: 22 },
  { lat: 37.7812, lng: -122.4302, timestamp: Date.now(), speed: 4.0, alt: 25 },
];

// Helper to calculate distance in meters using Haversine formula
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2 - lat1) * Math.PI/180;
  const Δλ = (lon2 - lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function App() {
  const [coordinates, setCoordinates] = useState<Coordinate[]>(INITIAL_DEMO_TRACE);
  const [plannedPath, setPlannedPath] = useState<Coordinate[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineBannerDismissed, setIsOfflineBannerDismissed] = useState(false);
  const [storageStats, setStorageStats] = useState({ count: 0, size: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Storage State
  const [savedTraces, setSavedTraces] = useState<SavedTrace[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [traceName, setTraceName] = useState('');

  const [stats, setStats] = useState<TraceStats>({
    totalDistance: 0,
    duration: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    elevationGain: 0
  });
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  
  const watchIdRef = useRef<number | null>(null);
  const simulationIntervalRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importTraceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsOfflineBannerDismissed(false);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineBannerDismissed(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Update storage stats periodically
    const interval = setInterval(async () => {
      const stats = await offlineMapService.getStats();
      setStorageStats(stats);
    }, 5000);

    // Load saved traces
    loadSavedTraces();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const loadSavedTraces = async () => {
    try {
      const traces = await traceStorageService.getAllTraces();
      setSavedTraces(traces.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error("Failed to load traces", e);
    }
  };

  const calculateStats = useCallback((coords: Coordinate[]) => {
    if (coords.length < 2) {
      setStats({
        totalDistance: 0,
        duration: 0,
        avgSpeed: 0,
        maxSpeed: 0,
        elevationGain: 0
      });
      return;
    }

    let dist = 0;
    let maxS = 0;
    let gain = 0;

    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];

      const d = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      dist += d;

      if (curr.speed) {
        if (curr.speed * 3.6 > maxS) maxS = curr.speed * 3.6;
      }
      
      if (curr.alt && prev.alt && curr.alt > prev.alt) gain += (curr.alt - prev.alt);
    }

    const durationSeconds = (coords[coords.length-1].timestamp - coords[0].timestamp) / 1000;

    setStats({
      totalDistance: Math.round(dist),
      duration: Math.round(durationSeconds),
      // Only calculate average speed if duration is significant (>1s) to avoid infinity/massive spikes
      avgSpeed: durationSeconds > 1 ? parseFloat(((dist / durationSeconds) * 3.6).toFixed(1)) : 0,
      maxSpeed: parseFloat(maxS.toFixed(1)),
      elevationGain: Math.round(gain)
    });
  }, []);

  useEffect(() => {
    calculateStats(coordinates);
  }, [coordinates, calculateStats]);

  const parseGPX = (content: string): Coordinate[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "text/xml");
    const trackPoints = xmlDoc.getElementsByTagName("trkpt");
    
    const parsedCoords: Coordinate[] = [];
    
    for (let i = 0; i < trackPoints.length; i++) {
      const point = trackPoints[i];
      const lat = parseFloat(point.getAttribute("lat") || "0");
      const lng = parseFloat(point.getAttribute("lon") || "0");
      const ele = point.getElementsByTagName("ele")[0]?.textContent;
      const time = point.getElementsByTagName("time")[0]?.textContent;
      
      const timestamp = time ? new Date(time).getTime() : Date.now();
      let speed = 0;

      // Calculate speed based on distance/time from previous point if available
      // This populates speed for imported GPX files that lack it
      if (i > 0) {
        const prev = parsedCoords[i - 1];
        const dist = calculateDistance(prev.lat, prev.lng, lat, lng);
        const timeDiff = (timestamp - prev.timestamp) / 1000; // seconds
        if (timeDiff > 0) {
          speed = dist / timeDiff; // m/s
        }
      }
      
      parsedCoords.push({
        lat,
        lng,
        alt: ele ? parseFloat(ele) : 0,
        timestamp,
        speed: speed
      });
    }
    return parsedCoords;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const gpxContent = e.target?.result as string;
      const parsedCoords = parseGPX(gpxContent);
      
      if (parsedCoords.length > 0) {
        setPlannedPath(parsedCoords);
        setIsSidebarOpen(false);
      } else {
        alert("Could not find valid track points in GPX file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportTrace = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const gpxContent = e.target?.result as string;
      const parsedCoords = parseGPX(gpxContent);
      
      if (parsedCoords.length > 0) {
        setCoordinates(parsedCoords);
        setAnalysis(null);
        setAppState(AppState.VIEWING);
        setIsSidebarOpen(false);
      } else {
        alert("Could not find valid track points in GPX file.");
      }
    };
    reader.readAsText(file);
  };

  const handleSaveTrace = async () => {
    if (!traceName.trim() || coordinates.length === 0) return;

    const newTrace: SavedTrace = {
      id: crypto.randomUUID(),
      name: traceName,
      createdAt: Date.now(),
      coordinates: coordinates,
      stats: stats,
      analysis: analysis
    };

    try {
      await traceStorageService.saveTrace(newTrace);
      await loadSavedTraces();
      setIsSaveModalOpen(false);
      setTraceName('');
    } catch (e) {
      alert("Failed to save trace.");
      console.error(e);
    }
  };

  const handleDeleteTrace = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm('Are you sure you want to delete this saved journey?')) {
      await traceStorageService.deleteTrace(id);
      await loadSavedTraces();
    }
  };

  const handleLoadSavedTrace = (trace: SavedTrace) => {
    setCoordinates(trace.coordinates);
    setAnalysis(trace.analysis || null);
    setAppState(AppState.VIEWING);
  };
  
  const handleLoadSavedTraceAsReference = (trace: SavedTrace, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlannedPath(trace.coordinates);
    setIsSidebarOpen(false);
  };

  const exportToGPX = () => {
    if (coordinates.length === 0) {
      alert("No coordinates to export.");
      return;
    }

    const gpxString = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="GeoTrace AI" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>GeoTrace AI Export</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>Recorded Trace</name>
    <trkseg>
      ${coordinates.map(c => `
      <trkpt lat="${c.lat}" lon="${c.lng}">
        <ele>${c.alt || 0}</ele>
        <time>${new Date(c.timestamp).toISOString()}</time>
      </trkpt>`).join('')}
    </trkseg>
  </trk>
</gpx>`;

    const blob = new Blob([gpxString], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geotrace_${new Date().getTime()}.gpx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startRecording = useCallback(() => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser");
      return;
    }

    setCoordinates([]);
    setAnalysis(null);
    setAppState(AppState.RECORDING);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newCoord: Coordinate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          alt: position.coords.altitude || 0,
          timestamp: position.timestamp,
          speed: position.coords.speed || 0
        };
        setCoordinates(prev => [...prev, newCoord]);
      },
      (error) => {
        console.error("Geolocation Error:", error);
        setErrorMessage(`Recording failed: ${error.message} (Code ${error.code})`);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  }, []);

  const stopRecording = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current !== null) {
      window.clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    
    setAppState(AppState.ANALYZING);
    try {
      const result = await analyzeTrace(coordinates);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setAppState(AppState.VIEWING);
    }
  }, [coordinates]);

  const startSimulation = () => {
    setCoordinates([]);
    setAnalysis(null);
    setAppState(AppState.RECORDING);
    
    let currentLat = plannedPath.length > 0 ? plannedPath[0].lat : 37.7749;
    let currentLng = plannedPath.length > 0 ? plannedPath[0].lng : -122.4194;
    let angle = Math.random() * Math.PI * 2;
    
    simulationIntervalRef.current = window.setInterval(() => {
      angle += (Math.random() - 0.5) * 0.4;
      const speed = Math.random() * 0.0005 + 0.0002;
      currentLat += Math.sin(angle) * speed;
      currentLng += Math.cos(angle) * speed;
      
      const newCoord: Coordinate = {
        lat: currentLat,
        lng: currentLng,
        timestamp: Date.now(),
        speed: speed * 50000, 
        alt: 10 + Math.random() * 5
      };
      setCoordinates(prev => [...prev, newCoord]);
    }, 1000);
  };

  const clearOfflineData = async () => {
    if (confirm('Are you sure you want to clear all cached map tiles?')) {
      await offlineMapService.clearCache();
      setStorageStats({ count: 0, size: 0 });
    }
  };

  const formatDistance = (m: number) => m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m`;
  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m ${sec}s`;
  };

  const isBannerVisible = !isOnline && !isOfflineBannerDismissed;

  // Calculate top offset for metrics based on visible banners
  const getMetricsTopClass = () => {
    let offset = 4; // base top-4
    if (isBannerVisible) offset += 10;
    if (errorMessage) offset += 10;
    
    // Return approximate tailwind classes based on combined height
    if (isBannerVisible && errorMessage) return 'top-28';
    if (isBannerVisible || errorMessage) return 'top-16';
    return 'top-4';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      {/* Sidebar Navigation */}
      <aside className={`fixed md:relative z-[2000] h-full transition-all duration-300 ease-in-out shadow-2xl border-r border-slate-200 bg-white flex flex-col ${isSidebarOpen ? 'w-full md:w-[420px]' : 'w-0 -translate-x-full md:translate-x-0 md:w-0 overflow-hidden'}`}>
        
        <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
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
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/10"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-[280px]">
              Visualizing the journey with intelligence.
            </p>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          
          <section className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Controls</h2>
            <div className="grid grid-cols-1 gap-3">
              {appState !== AppState.RECORDING && appState !== AppState.ANALYZING ? (
                <button 
                  onClick={startRecording}
                  className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all hover:shadow-xl hover:shadow-blue-500/20 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Record New Trace
                </button>
              ) : appState === AppState.ANALYZING ? (
                <button 
                  disabled
                  className="flex items-center justify-center gap-3 bg-slate-200 text-slate-400 py-4 rounded-2xl font-bold transition-all"
                >
                  <Sparkles className="w-5 h-5 animate-spin" />
                  Synthesizing Insights...
                </button>
              ) : (
                <button 
                  onClick={stopRecording}
                  className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Finish & Analyze
                </button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button 
                  disabled={appState === AppState.RECORDING || appState === AppState.ANALYZING}
                  onClick={startSimulation}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  <Wind className="w-4 h-4" />
                  Simulate
                </button>
                <button 
                  onClick={() => {setCoordinates([]); setAnalysis(null); setAppState(AppState.IDLE);}}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 py-3 rounded-xl text-sm font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>
          </section>

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
                      disabled={coordinates.length === 0}
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
                            onClick={handleSaveTrace}
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
                    <input type="file" accept=".gpx" className="hidden" ref={importTraceInputRef} onChange={handleImportTrace} />
                    <button 
                      onClick={() => importTraceInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-slate-100"
                    >
                      <Upload className="w-3 h-3" />
                      Import GPX
                    </button>
                    
                    <button 
                      onClick={exportToGPX}
                      disabled={coordinates.length === 0}
                      className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-xl text-[10px] font-bold transition-all border border-slate-100 disabled:opacity-50"
                    >
                      <FileDown className="w-3 h-3" />
                      Export GPX
                    </button>
                  </div>

                  <input type="file" accept=".gpx" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
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
                            onClick={() => handleLoadSavedTrace(trace)}
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
                                  onClick={(e) => handleLoadSavedTraceAsReference(trace, e)}
                                  className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                  title="Load as Reference Layer"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={(e) => handleDeleteTrace(trace.id, e)}
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
        </div>
      </aside>

      {/* Main Map Content */}
      <main className="flex-1 flex flex-col relative h-full group">
        <div className="flex-1 bg-slate-100 relative overflow-hidden">
          <TraceMap 
            coordinates={coordinates} 
            plannedPath={plannedPath} 
            isRecording={appState === AppState.RECORDING} 
            analysis={analysis}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isOfflineBannerVisible={isBannerVisible}
            isErrorBannerVisible={!!errorMessage}
            onError={setErrorMessage}
            isChartCollapsed={isChartCollapsed}
            storageStats={storageStats}
            onClearCache={clearOfflineData}
          />
          
          {/* Notification Banners Container */}
          <div className="absolute top-0 left-0 right-0 z-[3000] flex flex-col items-stretch animate-in slide-in-from-top duration-300 pointer-events-none">
            {/* Error Banner */}
            {errorMessage && (
              <div className="bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 shadow-xl flex items-center justify-between border-b border-red-500/30 backdrop-blur-xl pointer-events-auto">
                 <div className="flex-1 flex justify-center items-center gap-3">
                   <AlertTriangle className="w-4 h-4" />
                   <span className="truncate max-w-[calc(100vw-100px)]">{errorMessage}</span>
                 </div>
                 <button 
                  onClick={() => setErrorMessage(null)}
                  className="hover:bg-black/10 p-1.5 rounded-full transition-colors ml-4"
                  title="Dismiss Error"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
            )}

            {/* Offline Banner */}
            {isBannerVisible && (
               <div className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 shadow-xl flex items-center justify-between border-b border-orange-500/30 backdrop-blur-xl pointer-events-auto">
                 <div className="flex-1 flex justify-center items-center gap-3">
                   <WifiOff className="w-4 h-4" />
                   Offline Mode • Operating with Cached Map Data
                 </div>
                 <button 
                  onClick={() => setIsOfflineBannerDismissed(true)}
                  className="hover:bg-black/10 p-1.5 rounded-full transition-colors ml-4"
                  title="Dismiss Offline Alert"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </div>
            )}
          </div>

          {/* QUICK METRICS OVERLAY - Position shifts based on visible banners */}
          {(appState === AppState.RECORDING || (coordinates.length > 0 && !isSidebarOpen)) && (
            <div 
              className={`absolute left-6 z-[1000] flex flex-col gap-3 pointer-events-none transition-all duration-500 ${getMetricsTopClass()} ${isSidebarOpen ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'}`}
            >
               <div className="bg-white/90 backdrop-blur-md px-5 py-4 rounded-3xl shadow-2xl border border-white/50 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {appState === AppState.RECORDING && (
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
                        {((coordinates[coordinates.length-1]?.speed || 0) * 3.6).toFixed(1)} <span className="text-[10px] text-slate-400 font-medium">km/h</span>
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-200"></div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Mountain className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Altitude</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 tabular-nums">
                        {(coordinates[coordinates.length-1]?.alt || 0).toFixed(0)} <span className="text-[10px] text-slate-400 font-medium">m</span>
                      </span>
                    </div>
                    <div className="w-[1px] h-8 bg-slate-200"></div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Navigation className="w-3 h-3 text-emerald-500" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distance</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 tabular-nums">{formatDistance(stats.totalDistance)}</span>
                    </div>
                  </div>
               </div>
            </div>
          )}
          
          {/* Chart Overlay */}
          <div className={`absolute bottom-8 left-8 right-8 z-[1000] transition-all duration-500 ease-in-out transform ${coordinates.length > 2 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
             <div className={`max-w-4xl mx-auto backdrop-blur-xl bg-white/80 rounded-[2rem] shadow-2xl border border-white/50 overflow-hidden transition-all duration-500 ${isChartCollapsed ? 'p-1.5 px-6' : 'p-6'}`}>
               <StatsChart 
                 data={coordinates} 
                 isCollapsed={isChartCollapsed} 
                 onToggleCollapse={() => setIsChartCollapsed(!isChartCollapsed)} 
               />
             </div>
          </div>
        </div>
      </main>

    </div>
  );
}