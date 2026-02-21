import {
  dbGetChild,
  dbGetRecentMessages,
  dbAddMessage,
  dbUpdateMessage,
  dbGetActiveMissions,
  dbAddMission,
  dbAddAlert,
} from "@/lib/local-db";
import { analyzeEmotion, runSafetyGate } from "@/lib/providers/dust";
import { generateChatReply } from "@/lib/providers/gemini";
import { sendAlert } from "@/lib/providers/codewords";
import { updateDailyAnalytics } from "@/lib/analytics/aggregateDaily";
import { getRecentDailySummaries } from "@/lib/analytics/computeSignals";
import { getPolicyRules } from "@/constants/ageRules";
import type { Child, DustEmotionAnalysis, DustSafetyGate } from "@/types/domain";
import type { MessageDTO, DustEmotionInput, DustSafetyInput } from "@/types/api";

interface PipelineResult {
  assistantMessage: MessageDTO;
  flags: { rewritten: boolean; escalated: boolean; injectionAttempt: boolean };
  dustA: DustEmotionAnalysis;
  dustB: DustSafetyGate;
}

export async function runChatPipeline(
  childId: string,
  kidMessage: string
): Promise<PipelineResult> {
  // Step 1: Load child doc + recent messages + daily summaries
  const childDoc = dbGetChild(childId);
  if (!childDoc) throw new Error("Child not found");
  const child = childDoc as unknown as Child;

  const rawMessages = dbGetRecentMessages(childId, 20);
  const recentMessages: MessageDTO[] = rawMessages.map((m) => ({
    id: m.id as string,
    role: m.role as "kid" | "assistant",
    content: m.content as string,
    createdAt: (m.createdAt as string) || new Date().toISOString(),
    mood: m.mood as string | undefined,
    topics: m.topics as string[] | undefined,
  }));

  const dailySummaries = getRecentDailySummaries(childId, 7);
  const moodHistory = dailySummaries.map((s) => s.data.dominantMood as string);

  // Get active mission
  const activeMissions = dbGetActiveMissions(childId);
  const activeMission =
    activeMissions.length > 0
      ? {
          title: activeMissions[0].title as string,
          description: activeMissions[0].description as string,
        }
      : null;

  // Step 2: Store kid message
  const kidMsgId = dbAddMessage(childId, {
    role: "kid",
    content: kidMessage,
  });

  // Step 3: Dust A — Emotion/Context Analysis
  const dustAInput: DustEmotionInput = {
    childProfile: {
      name: child.name,
      age: child.age,
      characterName: child.characterName,
    },
    lastMessages: recentMessages.slice(-10),
    moodHistory,
    currentMessage: kidMessage,
    activeMission,
  };

  const dustA = await analyzeEmotion(dustAInput);

  // Update kid message with mood data
  dbUpdateMessage(childId, kidMsgId, {
    mood: dustA.currentMood,
    confidence: dustA.confidence,
    topics: dustA.categories,
  });

  // Step 4: Gemini Draft Reply
  const draft = await generateChatReply(
    child.characterName,
    child.characterInfo,
    child.age,
    kidMessage,
    recentMessages.map((m) => ({ role: m.role, content: m.content })),
    {
      recommendedTone: dustA.recommendedTone,
      suggestedApproach: dustA.suggestedApproach,
      currentMood: dustA.currentMood,
    }
  );

  // Step 5: Dust B — Safety Gate + Rewrite
  const dustBInput: DustSafetyInput = {
    childProfile: {
      name: child.name,
      age: child.age,
      characterName: child.characterName,
    },
    kidMessage,
    assistantDraft: draft,
    lastMessages: recentMessages.slice(-5),
    policyRules: getPolicyRules(child.age),
  };

  const dustB = await runSafetyGate(dustBInput);

  // Step 6: Store assistant message with full audit data
  const flags = {
    rewritten: !dustB.isCompliant || !!dustB.rewriteReason,
    escalated: dustB.escalate !== "NONE",
    injectionAttempt: dustB.injectionAttempt,
  };

  const now = new Date().toISOString();

  dbAddMessage(childId, {
    role: "assistant",
    content: dustB.finalReply,
    mood: dustA.currentMood,
    confidence: dustA.confidence,
    topics: dustA.categories,
    dustA,
    dustB,
    draft,
    flags,
  });

  // Step 7: Update daily analytics
  updateDailyAnalytics(
    childId,
    dustA.currentMood,
    dustA.categories,
    dustA.confidence
  );

  // Step 8: Handle escalation
  if (dustB.escalate !== "NONE") {
    dbAddAlert(childId, {
      riskLevel: dustB.riskLevel,
      categories: dustB.categories,
      summary:
        dustA.parentSummary ||
        dustB.parentMessage ||
        "Safety concern detected",
      deliveredVia: "codewords",
      status: "sent",
    });

    try {
      await sendAlert({
        childName: child.name,
        riskLevel: dustB.riskLevel,
        categories: dustB.categories,
        parentMessage: dustB.parentMessage || dustA.parentSummary,
        timestamp: now,
      });
    } catch (err) {
      console.error("CodeWords alert failed:", err);
    }
  }

  // Handle mission suggestion from Dust A
  if (dustA.suggestedMission) {
    dbAddMission(childId, {
      title: dustA.suggestedMission.title,
      description: dustA.suggestedMission.description,
      status: "active",
      source: "dust",
    });
  }

  const assistantMessage: MessageDTO = {
    role: "assistant",
    content: dustB.finalReply,
    createdAt: now,
    mood: dustA.currentMood,
    confidence: dustA.confidence,
    topics: dustA.categories,
    dustA,
    dustB,
    draft,
    flags,
  };

  return { assistantMessage, flags, dustA, dustB };
}
