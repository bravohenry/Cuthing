
export interface TranscriptItem {
  id: number;
  start: number; // seconds
  end: number;   // seconds
  text: string;
  category: 'speech' | 'silence' | 'music' | 'noise' | 'intro' | 'outro';
  speaker?: string; // e.g. "Speaker 1"
}

export interface Segment {
  id: string;
  start: number;
  end: number;
  description: string;
  active: boolean; // If false, this part is "cut"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  type: 'video' | 'image';
  url?: string; // Blob URL (session only)
  path?: string; // For future use
}

export interface Project {
  id: string;
  name: string;
  date: string;
  duration: string;
  // Persisted State
  transcript?: TranscriptItem[];
  segments?: Segment[];
  messages?: ChatMessage[];
  visualDescription?: string;
  lastModified?: number;
  isActive?: boolean;
  // Sub-items
  assets?: Asset[];
  sequenceName?: string;
}

// AI Response structure expected from Gemini
export interface AIEditResponse {
  reply: string;
  editedSegments: Segment[]; // The new timeline structure
}

export type AnalysisStatus = 'idle' | 'extracting_audio' | 'transcribing' | 'ready' | 'error';
