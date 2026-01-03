import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TraceMap } from './components/TraceMap';
import { StatsChart } from './components/StatsChart';
import { Sidebar } from './components/Sidebar';
import { ControlPanel } from './components/ControlPanel';
import { TraceLibrary } from './components/TraceLibrary';
import { MetricsPanel } from './components/MetricsPanel';
import { QuickMetricsOverlay } from './components/QuickMetricsOverlay';
import { NotificationBanner } from './components/NotificationBanner';
import { NavigationOverlay, NavigationState } from './components/NavigationOverlay';
import { analyzeTrace } from './services/geminiService';
import { offlineMapService } from './services/offlineMapService';
import { traceStorageService } from './services/traceStorageService';
import { Coordinate, TraceStats, AppState, AIAnalysis, SavedTrace } from './types';

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
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [plannedPath, setPlannedPath] = useState<Coordinate[]>([]);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChartCollapsed, setIsChartCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineBannerDismissed, setIsOfflineBannerDismissed] = useState(false);
  const [storageStats, setStorageStats] = useState({ count: 0, size: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Navigation State
  const [navState, setNavState] = useState<NavigationState>({
    isActive: false,
    isOnTrack: true,
    distanceToRoute: 0,
    distanceToFinish: 0,
    estimatedDuration: 0
  });

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

  // Navigation Logic
  useEffect(() => {
    if (appState !== AppState.RECORDING || plannedPath.length === 0 || coordinates.length === 0) {
      setNavState(prev => ({ ...prev, isActive: false }));
      return;
    }

    const currentPos = coordinates[coordinates.length - 1];
    
    // Find nearest point on planned path
    let minDistance = Infinity;
    let closestIndex = -1;

    // Linear search for closest point (efficient enough for typical GPX traces < 10k points)
    for (let i = 0; i < plannedPath.length; i++) {
      const d = calculateDistance(currentPos.lat, currentPos.lng, plannedPath[i].lat, plannedPath[i].lng);
      if (d < minDistance) {
        minDistance = d;
        closestIndex = i;
      }
    }

    // Calculate remaining distance from closest point to end
    let remainingDistance = 0;
    for (let i = closestIndex; i < plannedPath.length - 1; i++) {
      remainingDistance += calculateDistance(
        plannedPath[i].lat, plannedPath[i].lng,
        plannedPath[i+1].lat, plannedPath[i+1].lng
      );
    }

    // Determine if on track (threshold: 40 meters)
    const isOnTrack = minDistance <= 40;
    
    // Estimate time based on current speed or average walking speed (5km/h ~ 1.4m/s)
    const currentSpeed = currentPos.speed || 1.4;
    const estimatedDuration = currentSpeed > 0.1 ? remainingDistance / currentSpeed : remainingDistance / 1.4;

    setNavState({
      isActive: true,
      isOnTrack,
      distanceToRoute: minDistance,
      distanceToFinish: remainingDistance,
      estimatedDuration
    });

  }, [coordinates, plannedPath, appState]);


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

      if (i > 0) {
        const prev = parsedCoords[i - 1];
        const dist = calculateDistance(prev.lat, prev.lng, lat, lng);
        const timeDiff = (timestamp - prev.timestamp) / 1000; 
        if (timeDiff > 0) {
          speed = dist / timeDiff; 
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

  const stopRecording = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (simulationIntervalRef.current !== null) {
      window.clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setAppState(AppState.VIEWING);
  }, []);

  const handleGenerateAnalysis = useCallback(async () => {
    if (coordinates.length === 0) return;
    
    setAppState(AppState.ANALYZING);
    try {
      const result = await analyzeTrace(coordinates);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setErrorMessage("Failed to generate analysis");
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

  const isBannerVisible = !isOnline && !isOfflineBannerDismissed;

  // Calculate top offset for metrics based on visible banners
  const getMetricsTopClass = () => {
    let offset = 4; // base top-4
    if (isBannerVisible) offset += 10;
    if (errorMessage) offset += 10;
    
    if (isBannerVisible && errorMessage) return 'top-28';
    if (isBannerVisible || errorMessage) return 'top-16';
    return 'top-4';
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden relative">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        isOnline={isOnline} 
        onClose={() => setIsSidebarOpen(false)}
      >
        <ControlPanel 
          appState={appState}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onStartSimulation={startSimulation}
          onReset={() => {setCoordinates([]); setAnalysis(null); setAppState(AppState.IDLE);}}
          onGenerateAnalysis={handleGenerateAnalysis}
          hasAnalysis={!!analysis}
        />

        <TraceLibrary 
          savedTraces={savedTraces}
          hasCoordinates={coordinates.length > 0}
          isSaveModalOpen={isSaveModalOpen}
          setIsSaveModalOpen={setIsSaveModalOpen}
          traceName={traceName}
          setTraceName={setTraceName}
          onSaveTrace={handleSaveTrace}
          onDeleteTrace={handleDeleteTrace}
          onLoadTrace={handleLoadSavedTrace}
          onLoadReferenceTrace={handleLoadSavedTraceAsReference}
          onImportGPX={handleImportTrace}
          onLoadReferenceLayer={handleFileUpload}
          onExportGPX={exportToGPX}
        />

        <MetricsPanel stats={stats} />
      </Sidebar>

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
          
          <NotificationBanner 
            errorMessage={errorMessage}
            isOffline={isBannerVisible}
            isOfflineDismissed={isOfflineBannerDismissed}
            onDismissError={() => setErrorMessage(null)}
            onDismissOffline={() => setIsOfflineBannerDismissed(true)}
          />

          <QuickMetricsOverlay 
            isVisible={appState === AppState.RECORDING || (coordinates.length > 0 && !isSidebarOpen)}
            positionClass={getMetricsTopClass()}
            isRecording={appState === AppState.RECORDING}
            speed={coordinates[coordinates.length-1]?.speed || 0}
            altitude={coordinates[coordinates.length-1]?.alt || 0}
            distance={stats.totalDistance}
            isSidebarOpen={isSidebarOpen}
          />
          
          {/* Bottom Panel Overlay: Shows Navigation Info OR Stats Chart */}
          <div className={`absolute bottom-8 left-4 right-4 sm:left-8 sm:right-8 z-[1000] flex justify-center transition-all duration-500 ease-in-out transform ${navState.isActive || coordinates.length > 2 ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
             {navState.isActive ? (
                <NavigationOverlay navState={navState} isVisible={true} />
             ) : (
                <div className={`w-full max-w-4xl backdrop-blur-xl bg-white/80 rounded-[2rem] shadow-2xl border border-white/50 overflow-hidden transition-all duration-500 ${isChartCollapsed ? 'p-1.5 px-6' : 'p-6'} pointer-events-auto`}>
                   <StatsChart 
                     data={coordinates} 
                     isCollapsed={isChartCollapsed} 
                     onToggleCollapse={() => setIsChartCollapsed(!isChartCollapsed)} 
                   />
                </div>
             )}
          </div>
        </div>
      </main>

    </div>
  );
}