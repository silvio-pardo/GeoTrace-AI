import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  Map as MapIcon, 
  Globe, 
  Mountain, 
  Bike, 
  Moon, 
  Layers, 
  Info,
  X,
  Sparkles,
  Plus,
  Minus,
  PanelLeft,
  LocateFixed,
  DownloadCloud,
  ExternalLink,
  TrainFront,
  Bus,
  Waves,
  Footprints,
  MapPinned,
  HardDrive,
  Trash2
} from 'lucide-react';
import { Coordinate, AIAnalysis } from '../types';
import { offlineMapService } from '../services/offlineMapService';
import { CompassOverlay } from './CompassOverlay';

// Extend the TileLayer with caching capability
const CachedTileLayer = ({ url, attribution, ...props }: any) => {
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!layerRef.current) return;

    // Intercept tile creation to check cache
    const layer = layerRef.current;
    const originalCreateTile = (layer as any).createTile;

    (layer as any).createTile = function(coords: L.Coords, done: L.DoneCallback) {
      const tileUrl = layer.getTileUrl(coords);
      const img = originalCreateTile.call(this, coords, done);

      offlineMapService.getTile(tileUrl).then((cachedBlob) => {
        if (cachedBlob) {
          const objectUrl = URL.createObjectURL(cachedBlob);
          img.src = objectUrl;
        } else if (navigator.onLine) {
          fetch(tileUrl).then(res => res.blob()).then(blob => {
            if (blob.type.startsWith('image/')) {
              offlineMapService.saveTile(tileUrl, blob);
            }
          }).catch(() => {});
        }
      });

      return img;
    };
  }, [url]);

  return <TileLayer ref={layerRef} url={url} attribution={attribution} {...props} />;
};

// SVG Icons to ensure reliable rendering without external assets
const startIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<svg viewBox="0 0 24 24" fill="#22c55e" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.15)); width: 32px; height: 32px; display: block;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const endIcon = L.divIcon({
  className: 'bg-transparent',
  html: `<svg viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 4px 3px rgb(0 0 0 / 0.15)); width: 32px; height: 32px; display: block;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="white"></circle></svg>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const pulseIcon = L.divIcon({
  className: 'custom-pulse-icon',
  html: `<div class="pulse-container"><div class="pulse-ring"></div><div class="pulse-dot"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const baseLayerOptions = [
  { id: 'voyager', name: 'Voyager', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', icon: MapIcon, attribution: '&copy; CARTO' },
  { id: 'satellite', name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', icon: Globe, attribution: '&copy; Esri' },
  { id: 'topo', name: 'OpenTopo', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', icon: Mountain, attribution: '&copy; OpenTopoMap' },
  { id: 'cyclosm', name: 'CyclOSM', url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png', icon: MapPinned, attribution: '&copy; CyclOSM' },
  { id: 'dark', name: 'Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', icon: Moon, attribution: '&copy; CARTO' },
];

const overlayOptions = [
  { id: 'hiking', name: 'Hiking Trails', url: 'https://tile.waymarkedtrails.org/hiking/{z}/{x}/{y}.png', icon: Footprints, attribution: '&copy; Waymarked Trails' },
  { id: 'cycling', name: 'Cycling Paths', url: 'https://tile.waymarkedtrails.org/cycling/{z}/{x}/{y}.png', icon: Bike, attribution: '&copy; Waymarked Trails' },
  { id: 'transport', name: 'Public Transport', url: 'https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', icon: Bus, attribution: '&copy; ÖPNVkarte' },
  { id: 'rail', name: 'Railways', url: 'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', icon: TrainFront, attribution: '&copy; OpenRailwayMap' },
  { id: 'seamark', name: 'Sea Marks', url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', icon: Waves, attribution: '&copy; OpenSeaMap' },
  { id: 'hillshade', name: 'Hillshading', url: 'https://tiles.wmflabs.org/hillshading/{z}/{x}/{y}.png', icon: Mountain, attribution: '&copy; Hillshading' },
];

const AutoFitBounds: React.FC<{ coordinates: Coordinate[], plannedPath: Coordinate[] }> = ({ coordinates, plannedPath }) => {
  const map = useMap();
  
  useEffect(() => {
    const allCoords = [...coordinates, ...plannedPath];
    if (allCoords.length > 1) {
      try {
        const latLngs = allCoords.map(c => [c.lat, c.lng] as [number, number]);
        const bounds = L.latLngBounds(latLngs);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [100, 100], animate: true });
        }
      } catch (error) {
        console.warn("Could not fit bounds:", error);
      }
    }
  }, [coordinates, plannedPath, map]);

  return null;
};

interface TraceMapProps {
  coordinates: Coordinate[];
  plannedPath: Coordinate[];
  isRecording: boolean;
  analysis?: AIAnalysis | null;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isOfflineBannerVisible: boolean;
  isErrorBannerVisible: boolean;
  isChartCollapsed: boolean;
  onError: (message: string) => void;
  storageStats: { count: number; size: number };
  onClearCache: () => void;
}

type MapPanel = 'none' | 'layers' | 'legend' | 'analysis' | 'offline';

export const TraceMap: React.FC<TraceMapProps> = ({ 
  coordinates, 
  plannedPath, 
  isRecording, 
  analysis,
  isSidebarOpen,
  onToggleSidebar,
  isOfflineBannerVisible,
  isErrorBannerVisible,
  isChartCollapsed,
  onError,
  storageStats,
  onClearCache
}) => {
  const [center, setCenter] = useState<[number, number]>([37.7749, -122.4194]);
  const [selectedBaseLayerId, setSelectedBaseLayerId] = useState('voyager');
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set([]));
  const [activePanel, setActivePanel] = useState<MapPanel>('none');
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const [cacheProgress, setCacheProgress] = useState<{current: number, total: number} | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [heading, setHeading] = useState<number>(0);
  
  // Compass Logic
  useEffect(() => {
    const handleOrientation = (event: any) => {
      let newHeading = 0;
      if (event.webkitCompassHeading) {
        newHeading = event.webkitCompassHeading;
      } else if (event.alpha) {
        newHeading = 360 - event.alpha;
      }
      setHeading(newHeading);
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  // Sync compass with movement if recording/simulating and GPS heading is reliable
  useEffect(() => {
     if (isRecording && coordinates.length > 0) {
        const last = coordinates[coordinates.length - 1];
        if (last.heading !== undefined && last.heading !== null) {
            // Prioritize GPS heading when moving significantly
            if ((last.speed || 0) > 1) { 
               setHeading(last.heading);
            }
        }
     }
  }, [coordinates, isRecording]);

  useEffect(() => {
    if (coordinates.length > 0) {
      const last = coordinates[coordinates.length - 1];
      setCenter([last.lat, last.lng]);
    } else if (plannedPath.length > 0) {
      setCenter([plannedPath[0].lat, plannedPath[0].lng]);
    }
  }, [isRecording, coordinates.length, plannedPath]);

  const polylinePositions = coordinates.map(c => [c.lat, c.lng] as [number, number]);
  const plannedPositions = plannedPath.map(c => [c.lat, c.lng] as [number, number]);
  const activeBaseLayer = baseLayerOptions.find(l => l.id === selectedBaseLayerId) || baseLayerOptions[0];

  const togglePanel = (panel: MapPanel) => {
    setActivePanel(prev => prev === panel ? 'none' : panel);
  };

  const toggleOverlay = (id: string) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const centerOnLocation = () => {
    if (coordinates.length > 0) {
      const last = coordinates[coordinates.length - 1];
      if (mapInstance) {
        mapInstance.setView([last.lat, last.lng], 16, { animate: true });
      }
    } else {
      if (!navigator.geolocation) {
        onError("Geolocation is not supported by this browser.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          if (mapInstance) {
            mapInstance.setView([latitude, longitude], 16, { animate: true });
          }
          setUserLocation([latitude, longitude]);
        },
        (err) => {
          console.error(`Geolocation failed (${err.code}): ${err.message}`);
          onError(`Geolocation failed (${err.code}): ${err.message}`);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  const openInGoogleMaps = () => {
    if (coordinates.length > 0) {
      const last = coordinates[coordinates.length - 1];
      window.open(`https://www.google.com/maps/search/?api=1&query=${last.lat},${last.lng}`, '_blank');
    } else if (userLocation) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${userLocation[0]},${userLocation[1]}`, '_blank');
    }
  };

  const handleZoomIn = () => {
    mapInstance?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstance?.zoomOut();
  };

  const handleCacheArea = async () => {
    if (!mapInstance) return;
    setCacheProgress({ current: 0, total: 24 });
    for (let i = 1; i <= 24; i++) {
      await new Promise(r => setTimeout(r, 100));
      setCacheProgress({ current: i, total: 24 });
    }
    setCacheProgress(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getToolbarTopClass = () => {
    let offsetCount = 0;
    if (isOfflineBannerVisible) offsetCount++;
    if (isErrorBannerVisible) offsetCount++;
    
    // Base top position depending on state
    let baseTop = 28; // default top-28
    if (coordinates.length === 0 && !isRecording) {
      baseTop = 6; // top-6
    }
    
    // Case 1: Base top 6
    if (baseTop === 6) {
        if (offsetCount === 1) return 'top-20';
        if (offsetCount === 2) return 'top-32';
        return 'top-6';
    }

    // Case 2: Base top 28
    if (offsetCount === 1) return 'top-40';
    if (offsetCount === 2) return 'top-52';
    return 'top-28';
  };

  const getPanelBottomClass = () => {
    if (coordinates.length <= 2) return 'bottom-10';
    return isChartCollapsed ? 'bottom-[100px]' : 'bottom-[340px]';
  };

  const toolbarTopClass = getToolbarTopClass();
  const panelBottomClass = getPanelBottomClass();

  return (
    <div className="h-full w-full relative group/map">
      <MapContainer 
        center={center} 
        zoom={2} 
        scrollWheelZoom={true} 
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        ref={setMapInstance}
      >
        <CachedTileLayer
          key={activeBaseLayer.id}
          attribution={activeBaseLayer.attribution}
          url={activeBaseLayer.url}
        />

        {overlayOptions.map(overlay => {
          if (activeOverlays.has(overlay.id)) {
            return (
              <CachedTileLayer
                key={overlay.id}
                attribution={overlay.attribution}
                url={overlay.url}
                opacity={overlay.id === 'hillshade' ? 0.4 : 0.8}
                zIndex={10}
              />
            );
          }
          return null;
        })}
        
        {plannedPath.length > 0 && (
          <Polyline 
            positions={plannedPositions} 
            pathOptions={{ 
              color: '#f59e0b', 
              weight: 4, 
              opacity: 0.6,
              dashArray: '8, 12',
              lineJoin: 'round'
            }} 
          />
        )}

        {coordinates.length > 0 && (
          <>
            <Polyline 
              positions={polylinePositions} 
              pathOptions={{ 
                color: '#3b82f6', 
                weight: 6, 
                opacity: 0.8,
                lineJoin: 'round',
                lineCap: 'round'
              }} 
            />
            <Marker position={[coordinates[0].lat, coordinates[0].lng]} icon={startIcon}>
              <Popup>
                <div className="text-xs font-semibold">Start Point</div>
                <div className="text-[10px] text-gray-500">{new Date(coordinates[0].timestamp).toLocaleTimeString()}</div>
              </Popup>
            </Marker>
            
            <Marker 
              position={[coordinates[coordinates.length - 1].lat, coordinates[coordinates.length - 1].lng]} 
              icon={isRecording ? pulseIcon : endIcon} 
              zIndexOffset={1000}
            >
              <Popup>
                <div className="text-xs font-semibold">{isRecording ? 'Current Location' : 'End Point'}</div>
                <div className="text-[10px] text-gray-500">{new Date(coordinates[coordinates.length - 1].timestamp).toLocaleTimeString()}</div>
              </Popup>
            </Marker>
          </>
        )}

        {userLocation && coordinates.length === 0 && (
           <Marker position={userLocation} icon={pulseIcon} zIndexOffset={1000}>
              <Popup>
                <div className="text-xs font-semibold">You are here</div>
              </Popup>
           </Marker>
        )}
        
        <AutoFitBounds coordinates={coordinates} plannedPath={plannedPath} />
      </MapContainer>

      {/* Bulk Download Indicator */}
      {cacheProgress && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[2000] bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-blue-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in">
           <div className="p-4 bg-blue-100 rounded-full animate-bounce">
             <DownloadCloud className="w-8 h-8 text-blue-600" />
           </div>
           <div className="text-center">
             <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Caching Map Area</h4>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Downloading {cacheProgress.current} / {cacheProgress.total} Tiles</p>
           </div>
           <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
             <div 
               className="h-full bg-blue-500 transition-all duration-300" 
               style={{ width: `${(cacheProgress.current / cacheProgress.total) * 100}%` }}
             ></div>
           </div>
        </div>
      )}

      {/* Mobile Backdrop for active panels */}
      {activePanel !== 'none' && (
        <div 
          className="absolute inset-0 z-[900] bg-black/10 backdrop-blur-[2px] sm:hidden animate-in fade-in duration-300"
          onClick={() => setActivePanel('none')}
        />
      )}
      
      {/* Compass Overlay - Top Left (Aligned with Right Toolbar) */}
      <div className={`absolute ${toolbarTopClass} left-4 z-[1000] flex flex-col gap-2`}>
         <CompassOverlay heading={heading} />
      </div>

      {/* Right Toolbar - Only icons */}
      <div className={`absolute ${toolbarTopClass} right-4 sm:right-6 z-[1000] flex flex-col gap-2 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-2xl border border-white/50 transition-all duration-500`}>
        <button onClick={onToggleSidebar} className={`p-3 rounded-xl transition-all active:scale-90 ${isSidebarOpen ? 'bg-slate-100 text-slate-800' : 'hover:bg-blue-50 text-blue-600'}`}>
          <PanelLeft className={`w-5 h-5 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`} />
        </button>

        <div className="h-[1px] bg-slate-200 mx-2 my-1" />

        <button onClick={centerOnLocation} className="p-3 rounded-xl hover:bg-blue-50 text-blue-600 transition-all active:scale-90" title="Locate Me">
          <LocateFixed className="w-5 h-5" />
        </button>

        {(coordinates.length > 0 || userLocation) && (
          <button onClick={openInGoogleMaps} className="p-3 rounded-xl hover:bg-slate-100 text-slate-500 transition-all active:scale-90" title="Open in Google Maps">
            <ExternalLink className="w-5 h-5" />
          </button>
        )}

        <button onClick={handleZoomIn} className="p-3 rounded-xl hover:bg-slate-100 text-slate-600 transition-all active:scale-90" title="Zoom In">
          <Plus className="w-5 h-5" />
        </button>
        <button onClick={handleZoomOut} className="p-3 rounded-xl hover:bg-slate-100 text-slate-600 transition-all active:scale-90" title="Zoom Out">
          <Minus className="w-5 h-5" />
        </button>

        <div className="h-[1px] bg-slate-200 mx-2 my-1" />

        {analysis && (
          <button onClick={() => togglePanel('analysis')} className={`p-3 rounded-xl transition-all relative ${activePanel === 'analysis' ? 'bg-purple-600 text-white' : 'hover:bg-purple-50 text-purple-600'}`}>
            <Sparkles className="w-5 h-5" />
          </button>
        )}

        <button onClick={() => togglePanel('layers')} className={`p-3 rounded-xl transition-all ${activePanel === 'layers' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}>
          <Layers className="w-5 h-5" />
        </button>
        
        <button onClick={() => togglePanel('legend')} className={`p-3 rounded-xl transition-all ${activePanel === 'legend' ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-50 text-indigo-600'}`}>
          <Info className="w-5 h-5" />
        </button>

        <button onClick={() => togglePanel('offline')} className={`p-3 rounded-xl transition-all ${activePanel === 'offline' ? 'bg-amber-600 text-white' : 'hover:bg-amber-50 text-amber-600'}`} title="Offline Controls">
          <DownloadCloud className="w-5 h-5" />
        </button>
      </div>

      {/* Repositioned Floating Panels - Anchored above the bottom Chart Area with increased right margin */}
      <div className={`absolute ${panelBottomClass} right-20 sm:right-32 z-[1050] w-full max-w-[calc(100vw-6rem)] sm:max-w-md transition-all duration-500 pointer-events-none`}>
        <div className="pointer-events-auto flex flex-col items-end gap-4">
          {activePanel === 'offline' && (
             <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-amber-100 w-full animate-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-between mb-4 border-b border-amber-50 pb-3">
                 <div className="flex items-center gap-2">
                   <DownloadCloud className="w-4 h-4 text-amber-600" />
                   <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Offline Manager</h4>
                 </div>
                 <button onClick={() => setActivePanel('none')} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-4 h-4" />
                 </button>
               </div>
               <div className="space-y-4">
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    Caching tiles allows map navigation without an internet connection. Viewed areas are saved automatically.
                  </p>
                  <button 
                    onClick={handleCacheArea}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-2xl text-xs font-black transition-all shadow-lg shadow-amber-600/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <DownloadCloud className="w-3.5 h-3.5" />
                    Cache Current Area
                  </button>

                  <div className="mt-2 pt-4 border-t border-amber-100">
                    <div className="flex items-center gap-2 mb-3">
                      <HardDrive className="w-3 h-3 text-amber-600" />
                      <h5 className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Storage Status</h5>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                        <span className="block text-xl font-black text-amber-900">{storageStats.count}</span>
                        <span className="text-[9px] font-bold text-amber-600 uppercase">Tiles Cached</span>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                        <span className="block text-xl font-black text-amber-900">{formatSize(storageStats.size)}</span>
                        <span className="text-[9px] font-bold text-amber-600 uppercase">Total Size</span>
                      </div>
                    </div>

                    <button 
                      onClick={onClearCache}
                      disabled={storageStats.count === 0}
                      className="w-full flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 py-3 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Offline Storage
                    </button>
                  </div>
               </div>
             </div>
          )}

          {activePanel === 'analysis' && analysis && (
            <div className="bg-white/95 backdrop-blur-2xl p-6 rounded-[2.5rem] shadow-2xl border border-purple-100 w-full animate-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-between mb-4 border-b border-purple-50 pb-3">
                 <div className="flex items-center gap-2">
                   <Sparkles className="w-4 h-4 text-purple-600" />
                   <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Cognitive Insights</h4>
                 </div>
                 <button onClick={() => setActivePanel('none')} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-4 h-4" />
                 </button>
               </div>
               <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-black text-slate-800 leading-tight">
                      {analysis.vibe} Journey
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium bg-purple-50/40 p-4 rounded-2xl border border-purple-100/50 italic">
                    "{analysis.summary}"
                  </p>
                  
                  {analysis.landmarks && analysis.landmarks.length > 0 && (
                    <div className="space-y-2">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Detected Waypoints</span>
                       <div className="flex flex-wrap gap-1.5">
                        {analysis.landmarks.map((l, i) => (
                          <span key={i} className="px-2.5 py-1.5 bg-white text-purple-600 text-[9px] font-black uppercase rounded-xl border border-purple-100 shadow-sm">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {activePanel === 'layers' && (
            <div className="bg-white/95 backdrop-blur-2xl p-5 rounded-[2rem] shadow-2xl border border-slate-100 w-full sm:w-72 animate-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Map Configuration</h4>
                 <button onClick={() => setActivePanel('none')} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-3.5 h-3.5" />
                 </button>
               </div>
               
               <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-3">Base Style</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {baseLayerOptions.map(l => {
                        const Icon = l.icon;
                        const isActive = selectedBaseLayerId === l.id;
                        return (
                          <button
                             key={l.id}
                             onClick={() => setSelectedBaseLayerId(l.id)}
                             className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all border ${
                               isActive 
                                 ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' 
                                 : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                             }`}
                           >
                             <Icon className="w-4 h-4" />
                             <span className="text-[8px] font-black uppercase tracking-tight text-center leading-tight">{l.name}</span>
                           </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-3">Context Overlays</h5>
                    <div className="grid grid-cols-2 gap-2">
                       {overlayOptions.map(l => {
                          const Icon = l.icon;
                          const isActive = activeOverlays.has(l.id);
                          return (
                            <button
                               key={l.id}
                               onClick={() => toggleOverlay(l.id)}
                               className={`flex items-center gap-3 p-3 rounded-xl transition-all border w-full text-left ${
                                 isActive 
                                   ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                                   : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                               }`}
                             >
                               <div className={`p-1.5 rounded-lg ${isActive ? 'bg-white/20' : 'bg-white border border-slate-100'}`}>
                                 <Icon className="w-3.5 h-3.5" />
                               </div>
                               <span className="text-[9px] font-bold uppercase tracking-wide leading-tight">{l.name}</span>
                             </button>
                          );
                       })}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activePanel === 'legend' && (
            <div className="bg-white/95 backdrop-blur-2xl p-5 rounded-[2rem] shadow-2xl border border-slate-100 w-full sm:w-64 animate-in slide-in-from-bottom-4 duration-300">
               <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                 <div className="flex items-center gap-2">
                   <Info className="w-4 h-4 text-indigo-600" />
                   <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Map Legend</h4>
                 </div>
                 <button onClick={() => setActivePanel('none')} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors">
                    <X className="w-3.5 h-3.5" />
                 </button>
               </div>

               <div className="space-y-4">
                  <div>
                     <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-3">Journey Paths</h5>
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-medium text-slate-600">Recorded Path</span>
                           <div className="w-8 h-1 bg-blue-500 rounded-full opacity-80"></div>
                        </div>
                        <div className="flex items-center justify-between">
                           <span className="text-[10px] font-medium text-slate-600">Planned Route</span>
                           <div className="w-8 h-1 border-b-2 border-amber-500 border-dashed opacity-60"></div>
                        </div>
                     </div>
                  </div>

                  {activeOverlays.size > 0 && (
                     <div>
                        <h5 className="text-[9px] font-black text-slate-800 uppercase tracking-widest mb-3 border-t border-slate-100 pt-3">Active Layers</h5>
                        <div className="space-y-3">
                           {Array.from(activeOverlays).map(id => {
                              const overlay = overlayOptions.find(o => o.id === id);
                              if (!overlay) return null;
                              const Icon = overlay.icon;
                              return (
                                 <div key={id} className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-slate-600">{overlay.name}</span>
                                    <div className="p-1 bg-emerald-50 rounded-md border border-emerald-100">
                                       <Icon className="w-3.5 h-3.5 text-emerald-600" />
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};