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

async function callDustWebhook<TInput, TOutput>(
  webhookUrl: string,
  input: TInput
): Promise<TOutput> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dust webhook error (${res.status}): ${body}`);
  }

  return res.json() as Promise<TOutput>;
}

export async function analyzeEmotion(
  input: DustEmotionInput
): Promise<DustEmotionAnalysis> {
  const url = process.env.DUST_EMOTION_WEBHOOK;
  if (!url) throw new Error("DUST_EMOTION_WEBHOOK not configured");
  return callDustWebhook<DustEmotionInput, DustEmotionAnalysis>(url, input);
}

export async function runSafetyGate(
  input: DustSafetyInput
): Promise<DustSafetyGate> {
  const url = process.env.DUST_SAFETY_WEBHOOK;
  if (!url) throw new Error("DUST_SAFETY_WEBHOOK not configured");
  return callDustWebhook<DustSafetyInput, DustSafetyGate>(url, input);
}

export async function askAdviser(
  input: DustAdviserInput
): Promise<DustAdviserOutput> {
  const url = process.env.DUST_ADVISER_WEBHOOK;
  if (!url) throw new Error("DUST_ADVISER_WEBHOOK not configured");
  return callDustWebhook<DustAdviserInput, DustAdviserOutput>(url, input);
}

export async function suggestMissions(
  input: DustMissionsInput
): Promise<DustMissionsOutput> {
  const url = process.env.DUST_MISSIONS_WEBHOOK;
  if (!url) throw new Error("DUST_MISSIONS_WEBHOOK not configured");
  return callDustWebhook<DustMissionsInput, DustMissionsOutput>(url, input);
}

export async function generateWeeklySummary(
  input: DustWeeklySummaryInput
): Promise<DustWeeklySummaryOutput> {
  const url = process.env.DUST_WEEKLY_SUMMARY_WEBHOOK;
  if (!url) throw new Error("DUST_WEEKLY_SUMMARY_WEBHOOK not configured");
  return callDustWebhook<DustWeeklySummaryInput, DustWeeklySummaryOutput>(
    url,
    input
  );
}
