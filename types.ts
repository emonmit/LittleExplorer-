export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Memory {
  id: string;
  locationName: string;
  coordinates: Coordinates;
  date: string; // ISO string YYYY-MM-DD
  companions: string[];
  description: string;
  funFact?: string;
  photos: string[]; // Base64 or URLs
  tags: string[];
}

export interface AIEnrichedData {
  locationName: string;
  coordinates: Coordinates;
  date?: string;
  companions?: string[];
  description: string;
  funFact: string;
  tags: string[];
}
