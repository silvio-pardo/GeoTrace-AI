
export interface Coordinate {
  lat: number;
  lng: number;
  alt?: number;
  timestamp: number;
  speed?: number;
  heading?: number | null;
  accuracy?: number;
}

export interface TraceStats {
  totalDistance: number;
  duration: number;
  avgSpeed: number;
  maxSpeed: number;
  elevationGain: number;
}

export interface AIAnalysis {
  summary: string;
  activityType: string;
  terrainDescription: string;
  landmarks: string[];
  vibe: string;
}

export interface SavedTrace {
  id: string;
  name: string;
  createdAt: number;
  coordinates: Coordinate[];
  stats: TraceStats;
  analysis?: AIAnalysis | null;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  VIEWING = 'VIEWING'
}