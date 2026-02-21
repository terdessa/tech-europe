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
const DUST_AGENT = () => process.env.DUST_AGENT_ID ?? "dust";

function isDustConfigured(): boolean {
  return !!DUST_API_KEY() && !!DUST_WORKSPACE();
}

/**
 * Calls the Dust Conversations API with blocking:true to get a synchronous response.
 * Parses the agent's reply as JSON matching TOutput.
 */
async function callDustAgent<TOutput>(
  prompt: string
): Promise<TOutput> {
  const apiKey = DUST_API_KEY();
  const workspace = DUST_WORKSPACE();
  const agentId = DUST_AGENT();

  const body = {
    blocking: true,
    visibility: "unlisted",
    title: "lumio-pipeline",
    message: {
      content: prompt,
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

  // Extract agent message content from conversation.content[1].value[0].content
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

  const cleaned = rawContent.replace(/```json\n?|\n?```/g, "").trim();

  try {
    return JSON.parse(cleaned) as TOutput;
  } catch {
    console.warn("[dust] Failed to parse agent JSON, raw:", cleaned.slice(0, 300));
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

export async function analyzeEmotion(
  input: DustEmotionInput
): Promise<DustEmotionAnalysis> {
  if (!isDustConfigured()) {
    console.warn("[dust] Not configured — using emotion fallback");
    return fallbackEmotion();
  }

  try {
    const prompt = `You are a child emotion interpreter for a kids' AI chat app called Lumio.
Analyze the following data and respond ONLY with valid JSON matching this schema:
{
  "currentMood": string,
  "confidence": number (0-1),
  "recentTriggers": string[],
  "weeklyTrend": "improving" | "stable" | "declining",
  "recommendedTone": string,
  "suggestedApproach": string,
  "warningFlag": boolean,
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "categories": string[],
  "parentSummary": string
}

Child: ${input.childProfile.name}, age ${input.childProfile.age}
Current message: "${input.currentMessage}"
Recent messages: ${JSON.stringify(input.lastMessages.slice(-10).map((m) => ({ role: m.role, text: m.content })))}
Mood history: ${JSON.stringify(input.moodHistory ?? [])}
Active mission: ${input.activeMission?.title ?? "none"}

Respond ONLY with the JSON object, no markdown, no explanation.`;

    return await callDustAgent<DustEmotionAnalysis>(prompt);
  } catch (e) {
    console.warn("[dust] Emotion analysis failed, using fallback:", e);
    return fallbackEmotion();
  }
}

// ─── Safety Gate ──────────────────────────────────────

export async function runSafetyGate(
  input: DustSafetyInput
): Promise<DustSafetyGate> {
  if (!isDustConfigured()) {
    console.warn("[dust] Not configured — using safety fallback");
    return fallbackSafety(input.assistantDraft);
  }

  try {
    const prompt = `You are a child safety gate for a kids' AI chat app called Lumio.
Review the assistant's draft reply and check it against safety policies.
Respond ONLY with valid JSON matching this schema:
{
  "isCompliant": boolean,
  "injectionAttempt": boolean,
  "violations": string[],
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "categories": string[],
  "finalReply": string (the safe version of the reply),
  "rewriteReason": string | null,
  "escalate": "NONE" | "PARENT" | "ADMIN"
}

Child: ${input.childProfile.name}, age ${input.childProfile.age}, character: ${input.childProfile.characterName}
Kid's message: "${input.kidMessage}"
Assistant's draft: "${input.assistantDraft}"
Recent conversation: ${JSON.stringify(input.lastMessages.slice(-5).map((m) => ({ role: m.role, text: m.content })))}
Policy rules (disallowed): ${JSON.stringify(input.policyRules)}

If the draft is safe, set isCompliant=true and finalReply to the original draft unchanged.
If unsafe, rewrite it in finalReply and explain in rewriteReason.
Respond ONLY with the JSON object, no markdown, no explanation.`;

    return await callDustAgent<DustSafetyGate>(prompt);
  } catch (e) {
    console.warn("[dust] Safety gate failed, using fallback:", e);
    return fallbackSafety(input.assistantDraft);
  }
}

// ─── Parent Adviser ───────────────────────────────────

export async function askAdviser(
  input: DustAdviserInput
): Promise<DustAdviserOutput> {
  const prompt = `You are a supportive parenting adviser for a kids' AI chat app called Lumio.
A parent is asking about their child. Respond ONLY with valid JSON matching this schema:
{
  "answer": string (detailed, empathetic advice, 2-4 paragraphs),
  "suggestedActions": string[] (2-3 concrete action items),
  "suggestedScripts": string[] (1-2 example phrases the parent could use)
}

Child: ${input.childProfile.name}, age ${input.childProfile.age}, character: ${input.childProfile.characterName}
Recent chats: ${JSON.stringify(input.last50Messages.slice(-15).map((m) => ({ role: m.role, text: m.content, mood: m.mood })))}

Parent's question: "${input.question}"

Respond ONLY with the JSON object, no markdown, no explanation.`;

  return callDustAgent<DustAdviserOutput>(prompt);
}

// ─── Mission Suggestions ──────────────────────────────

export async function suggestMissions(
  input: DustMissionsInput
): Promise<DustMissionsOutput> {
  const prompt = `You are a mission creator for a kids' AI chat app called Lumio.
Suggest fun, educational missions for a child based on their interests and recent conversations.
Respond ONLY with valid JSON matching this schema:
{
  "missions": [{ "title": string, "description": string, "category": string, "difficulty": "easy"|"medium"|"hard" }]
}

Child: ${input.childProfile.name}, age ${input.childProfile.age}, character: ${input.childProfile.characterName}
Recent topics: ${JSON.stringify(input.recentTopics)}
Recent moods: ${JSON.stringify(input.recentMoods)}
Current missions (avoid duplicates): ${JSON.stringify(input.currentMissions.map((m) => m.title))}

Suggest 3-5 new missions. Respond ONLY with the JSON object, no markdown, no explanation.`;

  return callDustAgent<DustMissionsOutput>(prompt);
}

// ─── Weekly Summary ───────────────────────────────────

export async function generateWeeklySummary(
  input: DustWeeklySummaryInput
): Promise<DustWeeklySummaryOutput> {
  const prompt = `You are a weekly report writer for a kids' AI chat app called Lumio.
Generate a warm, insightful weekly summary for a parent. Respond ONLY with valid JSON matching this schema:
{
  "narrative": string (3-5 paragraph summary of the week),
  "highlights": string[] (3-5 key highlights),
  "concerns": string[] (any concerns, empty if none),
  "recommendations": string[] (2-3 actionable recommendations)
}

Child: ${input.child.name}, age ${input.child.age}
Daily summaries: ${JSON.stringify(input.last7DaySummaries)}
Notable events: ${JSON.stringify(input.notableEvents)}
Mission status: ${JSON.stringify(input.missionStatus)}

Respond ONLY with the JSON object, no markdown, no explanation.`;

  return callDustAgent<DustWeeklySummaryOutput>(prompt);
}
