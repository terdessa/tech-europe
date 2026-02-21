export interface CharacterInfo {
  personality: string;
  speechStyle: string;
  keyTraits: string[];
  backstorySummary?: string;
  safeDepictionNote?: string;
}

export interface DustEmotionAnalysis {
  currentMood: string;
  confidence: number;
  recentTriggers: string[];
  weeklyTrend: string;
  recommendedTone: string;
  suggestedApproach: string;
  warningFlag: boolean;
  riskLevel: RiskLevel;
  categories: string[];
  parentSummary: string;
  suggestedMission?: { title: string; description: string };
}

export interface DustSafetyGate {
  isCompliant: boolean;
  injectionAttempt: boolean;
  violations: string[];
  riskLevel: RiskLevel;
  categories: string[];
  finalReply: string;
  rewriteReason?: string;
  escalate: EscalationLevel;
  parentMessage?: string;
}

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type EscalationLevel = "NONE" | "PARENT_NOTIFY" | "URGENT_NOTIFY";
export type MissionStatus = "active" | "completed";
export type MissionSource = "parent" | "dust";
export type MessageRole = "kid" | "assistant";
export type AlertStatus = "sent" | "failed";

export interface User {
  email: string;
  displayName: string;
  createdAt: string;
  passwordHash?: string;
  parentPinHash?: string;
  notificationPrefs?: {
    emailWeekly: boolean;
    emailMonthly: boolean;
    alerts: boolean;
  };
}

export interface Child {
  id?: string;
  parentId: string;
  name: string;
  age: number;
  characterName: string;
  characterInfo: CharacterInfo;
  characterImageUrl?: string;
  createdAt: string;
}

export interface Message {
  id?: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  mood?: string;
  confidence?: number;
  topics?: string[];
  dustA?: DustEmotionAnalysis;
  dustB?: DustSafetyGate;
  draft?: string;
  flags?: {
    rewritten: boolean;
    escalated: boolean;
    injectionAttempt: boolean;
  };
}

export interface Mission {
  id?: string;
  title: string;
  description: string;
  status: MissionStatus;
  createdAt: string;
  completedAt?: string;
  source: MissionSource;
}

export interface DailyAnalytics {
  dominantMood: string;
  moodBreakdown: Record<string, number>;
  topTopics: string[];
  messageCount: number;
  vocabularyScore: number;
  curiosityScore: number;
  updatedAt: string;
}

export interface Alert {
  id?: string;
  createdAt: string;
  riskLevel: RiskLevel;
  categories: string[];
  summary: string;
  deliveredVia: "codewords";
  status: AlertStatus;
}
