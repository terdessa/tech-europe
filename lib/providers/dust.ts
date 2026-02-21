import type { DustEmotionAnalysis, DustSafetyGate } from "@/types/domain";
import type {
  DustEmotionInput,
  DustSafetyInput,
  DustAdviserInput,
  DustAdviserOutput,
  DustMissionsInput,
  DustMissionsOutput,
  DustWeeklySummaryInput,
  DustWeeklySummaryOutput,
} from "@/types/api";

async function callDustWebhook<TOutput>(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<TOutput> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dust webhook error (${res.status}): ${body}`);
  }

  return res.json() as Promise<TOutput>;
}

function fallbackEmotion(): DustEmotionAnalysis {
  return {
    currentMood: "neutral",
    confidence: 0.5,
    recentTriggers: [],
    weeklyTrend: "stable",
    recommendedTone: "warm and friendly",
    suggestedApproach: "Be supportive and engaging",
    warningFlag: false,
    riskLevel: "LOW",
    categories: [],
    parentSummary: "",
  };
}

function fallbackSafety(draft: string): DustSafetyGate {
  return {
    isCompliant: true,
    injectionAttempt: false,
    violations: [],
    riskLevel: "LOW",
    categories: [],
    finalReply: draft,
    escalate: "NONE",
  };
}

function toMsgArray(messages: { role: string; content: string }[]) {
  return messages.map((m) => ({ role: m.role, text: m.content }));
}

export async function analyzeEmotion(
  input: DustEmotionInput
): Promise<DustEmotionAnalysis> {
  const url = process.env.DUST_EMOTION_WEBHOOK;
  if (!url) {
    console.warn("DUST_EMOTION_WEBHOOK not configured — using fallback");
    return fallbackEmotion();
  }

  const payload = {
    child: { name: input.childProfile.name, age: input.childProfile.age },
    currentMessage: input.currentMessage,
    recentMessages: toMsgArray(input.lastMessages),
    moodHistory: input.moodHistory,
    activeMission: input.activeMission
      ? input.activeMission.title
      : null,
  };

  return callDustWebhook<DustEmotionAnalysis>(url, payload);
}

export async function runSafetyGate(
  input: DustSafetyInput
): Promise<DustSafetyGate> {
  const url = process.env.DUST_SAFETY_WEBHOOK;
  if (!url) {
    console.warn("DUST_SAFETY_WEBHOOK not configured — using fallback (passing draft through)");
    return fallbackSafety(input.assistantDraft);
  }

  const payload = {
    child: { name: input.childProfile.name, age: input.childProfile.age },
    kidMessage: input.kidMessage,
    assistantDraft: input.assistantDraft,
    conversationHistory: toMsgArray(input.lastMessages),
    policy: { disallowed: input.policyRules },
  };

  return callDustWebhook<DustSafetyGate>(url, payload);
}

export async function askAdviser(
  input: DustAdviserInput
): Promise<DustAdviserOutput> {
  const url = process.env.DUST_ADVISER_WEBHOOK;
  if (!url) throw new Error("DUST_ADVISER_WEBHOOK not configured");

  const payload = {
    question: input.question,
    child: { name: input.childProfile.name, age: input.childProfile.age },
    dailySummaries: input.last30DaysSummaries,
    recentChats: input.last50Messages.map((m) => ({
      role: m.role,
      text: m.content,
      createdAt: m.createdAt,
      mood: m.mood ?? null,
      topics: m.topics ?? [],
    })),
    missions: [],
  };

  return callDustWebhook<DustAdviserOutput>(url, payload);
}

export async function suggestMissions(
  input: DustMissionsInput
): Promise<DustMissionsOutput> {
  const url = process.env.DUST_MISSIONS_WEBHOOK;
  if (!url) throw new Error("DUST_MISSIONS_WEBHOOK not configured");

  const payload = {
    child: { name: input.childProfile.name, age: input.childProfile.age },
    characterName: input.childProfile.characterName,
    recentTopics: input.recentTopics,
    recentMoods: input.recentMoods,
    currentMissions: input.currentMissions.map((m) => m.title),
  };

  return callDustWebhook<DustMissionsOutput>(url, payload);
}

export async function generateWeeklySummary(
  input: DustWeeklySummaryInput
): Promise<DustWeeklySummaryOutput> {
  const url = process.env.DUST_WEEKLY_SUMMARY_WEBHOOK;
  if (!url) throw new Error("DUST_WEEKLY_SUMMARY_WEBHOOK not configured");

  const payload = {
    child: input.child,
    dailySummaries: input.last7DaySummaries,
    notableEvents: input.notableEvents,
    missions: input.missionStatus,
  };

  return callDustWebhook<DustWeeklySummaryOutput>(url, payload);
}
