import type {
  CharacterInfo,
  CharacterGender,
  DustEmotionAnalysis,
  DustSafetyGate,
  Message,
} from "./domain";

// POST /api/character/create
export interface CreateCharacterRequest {
  childName: string;
  childAge: number;
  childInterests: string[];
  characterName: string;
  characterGender?: CharacterGender;
}

export interface CreateCharacterResponse {
  characterInfo: CharacterInfo;
  characterImageUrl?: string;
}

// POST /api/character/analyze-media
export interface AnalyzeMediaRequest {
  mediaTitle: string;
  mediaType: "cartoon" | "movie" | "book" | "game";
}

export interface AnalyzeMediaResponse {
  title: string;
  characters: {
    name: string;
    description: string;
    gender: CharacterGender;
  }[];
}

// POST /api/chat
export interface ChatRequest {
  childId: string;
  message: string;
}

export interface ChatResponse {
  assistantMessage: MessageDTO;
  flags: {
    rewritten: boolean;
    escalated: boolean;
    injectionAttempt: boolean;
  };
  dustA: DustEmotionAnalysis;
  dustB: DustSafetyGate;
}

export type MessageDTO = Omit<Message, "createdAt"> & {
  createdAt: string;
};

// POST /api/voice/stt
export interface STTResponse {
  transcript: string;
}

// POST /api/voice/tts
export interface TTSRequest {
  text: string;
  gender?: CharacterGender;
}

// Dust agent payloads
export interface DustEmotionInput {
  childProfile: {
    name: string;
    age: number;
    characterName: string;
  };
  lastMessages: MessageDTO[];
  moodHistory: string[];
  currentMessage: string;
  activeMission?: { title: string; description: string } | null;
}

export interface DustSafetyInput {
  childProfile: {
    name: string;
    age: number;
    characterName: string;
  };
  kidMessage: string;
  assistantDraft: string;
  lastMessages: MessageDTO[];
  policyRules: string[];
}

export interface DustAdviserInput {
  question: string;
  childProfile: {
    name: string;
    age: number;
    characterName: string;
  };
  last30DaysSummaries: Record<string, unknown>[];
  last50Messages: MessageDTO[];
}

export interface DustAdviserOutput {
  answer: string;
  suggestedActions: string[];
  suggestedScripts: string[];
}

export interface DustMissionsInput {
  childProfile: {
    name: string;
    age: number;
    characterName: string;
  };
  recentTopics: string[];
  recentMoods: string[];
  currentMissions: { title: string; description: string }[];
}

export interface DustMissionsOutput {
  missions: { title: string; description: string }[];
}

export interface DustWeeklySummaryInput {
  last7DaySummaries: Record<string, unknown>[];
  notableEvents: string[];
  missionStatus: { title: string; status: string }[];
}

export interface DustWeeklySummaryOutput {
  narrative: string;
  highlights: string[];
  concerns: string[];
  nextSteps: string[];
}
