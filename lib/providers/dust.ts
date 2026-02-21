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

const DUST_API_KEY = () => process.env.DUST_API_KEY ?? "";
const DUST_WORKSPACE = () => process.env.DUST_WORKSPACE_ID ?? "";
const DEFAULT_AGENT = () => process.env.DUST_AGENT_ID ?? "dust";

function getAgentId(role: string): string {
  const envKey = `DUST_${role.toUpperCase()}_AGENT_ID`;
  return process.env[envKey] || DEFAULT_AGENT();
}

function isDustConfigured(): boolean {
  return !!DUST_API_KEY() && !!DUST_WORKSPACE();
}

/**
 * Sends a JSON payload to a dedicated Dust agent via the Conversations API.
 * The agent has a structured response format configured, so we just send the input data.
 */
async function callDustAgent<TOutput>(
  payload: Record<string, unknown>,
  role = "default"
): Promise<TOutput> {
  const apiKey = DUST_API_KEY();
  const workspace = DUST_WORKSPACE();
  const agentId = getAgentId(role);
  console.log(`[dust] Calling agent "${agentId}" for role "${role}"`);

  const body = {
    blocking: true,
    visibility: "unlisted",
    title: `lumio-${role}`,
    message: {
      content: JSON.stringify(payload),
      mentions: [{ configurationId: agentId }],
      context: {
        timezone: "UTC",
        username: "lumio-api",
        fullName: "Lumio Backend",
        email: "api@lumio.app",
        profilePictureUrl: null,
        origin: "api",
      },
    },
  };

  const res = await fetch(
    `https://dust.tt/api/v1/w/${workspace}/assistant/conversations`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Dust API error (${res.status}): ${errBody}`);
  }

  const data = await res.json();

  const contentArr = data?.conversation?.content;
  if (!Array.isArray(contentArr) || contentArr.length < 2) {
    throw new Error("[dust] Unexpected conversation structure");
  }

  const agentTurn = contentArr[1];
  const agentMsg = agentTurn?.value?.[0] ?? agentTurn?.[0];
  const rawContent: string = agentMsg?.content ?? "";

  if (!rawContent) {
    throw new Error("[dust] Agent returned empty content");
  }

  console.log(`[dust] Agent "${agentId}" raw response:`, rawContent.slice(0, 200));
  const cleaned = rawContent.replace(/```json\n?|\n?```/g, "").trim();

  try {
    return JSON.parse(cleaned) as TOutput;
  } catch {
    console.warn("[dust] Failed to parse agent JSON, raw:", cleaned.slice(0, 500));
    throw new Error("[dust] Could not parse agent response as JSON");
  }
}

// ─── Fallbacks ────────────────────────────────────────

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

// ─── Emotion Interpreter ──────────────────────────────
// Agent: LumioEmotionInterpreter
// Input: { child, currentMessage, recentMessages, moodHistory, activeMission }

export async function analyzeEmotion(
  input: DustEmotionInput
): Promise<DustEmotionAnalysis> {
  if (!isDustConfigured()) {
    console.warn("[dust] Not configured — using emotion fallback");
    return fallbackEmotion();
  }

  try {
    const payload = {
      child: { name: input.childProfile.name, age: input.childProfile.age },
      currentMessage: input.currentMessage,
      recentMessages: input.lastMessages.slice(-10).map((m) => ({
        role: m.role,
        text: m.content,
      })),
      moodHistory: input.moodHistory ?? [],
      activeMission: input.activeMission?.title ?? null,
    };

    return await callDustAgent<DustEmotionAnalysis>(payload, "emotion");
  } catch (e) {
    console.warn("[dust] Emotion analysis failed, using fallback:", e);
    return fallbackEmotion();
  }
}

// ─── Safety Gate ──────────────────────────────────────
// Agent: SafetyGate
// Input: { child, kidMessage, assistantDraft, conversationHistory, policy }

export async function runSafetyGate(
  input: DustSafetyInput
): Promise<DustSafetyGate> {
  if (!isDustConfigured()) {
    console.warn("[dust] Not configured — using safety fallback");
    return fallbackSafety(input.assistantDraft);
  }

  try {
    const payload = {
      child: {
        name: input.childProfile.name,
        age: input.childProfile.age,
      },
      kidMessage: input.kidMessage,
      assistantDraft: input.assistantDraft,
      conversationHistory: input.lastMessages.slice(-5).map((m) => ({
        role: m.role,
        text: m.content,
      })),
      policy: { disallowed: input.policyRules },
    };

    return await callDustAgent<DustSafetyGate>(payload, "safety");
  } catch (e) {
    console.warn("[dust] Safety gate failed, using fallback:", e);
    return fallbackSafety(input.assistantDraft);
  }
}

// ─── Parent Adviser ───────────────────────────────────
// Agent: LumioParentAdviser
// Input: { question, child, dailySummaries, recentChats, missions }

export async function askAdviser(
  input: DustAdviserInput
): Promise<DustAdviserOutput> {
  const payload = {
    question: input.question,
    child: { name: input.childProfile.name, age: input.childProfile.age },
    dailySummaries: input.last30DaysSummaries,
    recentChats: input.last50Messages.slice(-20).map((m) => ({
      role: m.role,
      text: m.content,
      createdAt: m.createdAt,
      mood: m.mood ?? null,
      topics: m.topics ?? [],
    })),
    missions: [],
  };

  return callDustAgent<DustAdviserOutput>(payload, "adviser");
}

// ─── Mission Suggestions ──────────────────────────────
// Agent: LumioMissionSuggestions
// Input: { child, characterName, recentTopics, recentMoods, currentMissions }

export async function suggestMissions(
  input: DustMissionsInput
): Promise<DustMissionsOutput> {
  const payload = {
    child: { name: input.childProfile.name, age: input.childProfile.age },
    characterName: input.childProfile.characterName,
    recentTopics: input.recentTopics,
    recentMoods: input.recentMoods,
    currentMissions: input.currentMissions.map((m) => m.title),
  };

  return callDustAgent<DustMissionsOutput>(payload, "missions");
}

// ─── Weekly Summary ───────────────────────────────────
// Agent: LumioWeeklySummary
// Input: { child, dailySummaries, notableEvents, missions }

export async function generateWeeklySummary(
  input: DustWeeklySummaryInput
): Promise<DustWeeklySummaryOutput> {
  const payload = {
    child: input.child,
    dailySummaries: input.last7DaySummaries,
    notableEvents: input.notableEvents,
    missions: input.missionStatus,
  };

  return callDustAgent<DustWeeklySummaryOutput>(payload, "weekly");
}
