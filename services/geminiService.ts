
import { GoogleGenAI, Type } from "@google/genai";
import { Coordinate, AIAnalysis } from '../types';

export const analyzeTrace = async (coordinates: Coordinate[]): Promise<AIAnalysis> => {
  if (coordinates.length === 0) {
    throw new Error("No coordinates to analyze");
  }

  // Initialize with strict guideline compliance
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Downsample to ~50 points for context efficiency while retaining path shape
  const sampleRate = Math.max(1, Math.ceil(coordinates.length / 50)); 
  const sampledData = coordinates.filter((_, i) => i % sampleRate === 0).map(c => ({
    lat: c.lat.toFixed(5),
    lng: c.lng.toFixed(5),
    t: new Date(c.timestamp).toISOString(),
    s: c.speed ? (c.speed * 3.6).toFixed(1) : 0 // km/h
  }));

  const prompt = `
    Analyze this GPS trace data (Latitude, Longitude, Time, Speed in km/h).
    
    Data samples:
    ${JSON.stringify(sampledData)}

    Based on the movement patterns, speed fluctuations, and geographical coordinates:
    1. Identify the 'activityType' (e.g., Trail Running, Urban Commute, Road Trip, Sailing).
    2. Write a 'summary' - a 2-3 sentence evocative travel journal entry about this specific journey.
    3. Provide a 'terrainDescription' summarizing the environmental surroundings.
    4. List 3 'landmarks' or interesting waypoints that might be near this path.
    5. Define a 1-word 'vibe' for the journey (e.g., Adventurous, Serene, Industrial, Coastal).
    
    IMPORTANT: For 'vibe', do NOT use technical terms related to app operation like 'Launch', 'Start', 'Recording', or 'Trace'. Focus on the emotional or environmental character of the movement.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            activityType: { type: Type.STRING },
            terrainDescription: { type: Type.STRING },
            landmarks: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            vibe: { type: Type.STRING }
          },
          required: ["summary", "activityType", "terrainDescription", "landmarks", "vibe"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Your journey remains a mystery to the stars. The coordinates are recorded, but the story is yet to be told.",
      activityType: "Expedition",
      terrainDescription: "Unknown Territory",
      landmarks: ["Point Alpha", "Point Beta", "Point Gamma"],
      vibe: "Mysterious"
    };
  }
};
