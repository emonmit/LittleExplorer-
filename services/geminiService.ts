import { GoogleGenAI, Type } from "@google/genai";
import { AIEnrichedData } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enrichMemory = async (userInput: string): Promise<AIEnrichedData | null> => {
  try {
    const model = ai.models;
    
    // Updated prompt for Chinese output
    const response = await model.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract travel details from this text: "${userInput}". 
      Respond entirely in Simplified Chinese (zh-CN).
      If the user text implies a specific famous place, get its coordinates. 
      If no date is mentioned, ignore it. 
      If no companions are mentioned, ignore them.
      Generate a short, child-friendly description of the place in Chinese.
      Generate a "Fun Fact" about this place for a child in Chinese.
      Generate 3 short tags in Chinese (e.g. "大自然", "城市", "海滩").
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            locationName: { type: Type.STRING, description: "The formalized name of the location in Chinese" },
            coordinates: {
              type: Type.OBJECT,
              properties: {
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
              },
              required: ["lat", "lng"],
            },
            date: { type: Type.STRING, description: "ISO date string YYYY-MM-DD if available, else null", nullable: true },
            companions: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
            description: { type: Type.STRING, description: "A 1-2 sentence child-friendly summary in Chinese" },
            funFact: { type: Type.STRING, description: "A fun fact about the location in Chinese" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["locationName", "coordinates", "description", "funFact", "tags"],
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text) as AIEnrichedData;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};