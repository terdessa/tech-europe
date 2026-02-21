import { dbGetRecentAnalytics } from "@/lib/local-db";
import type { DailyAnalytics } from "@/types/domain";

export function getRecentDailySummaries(
  childId: string,
  days: number
): { date: string; data: DailyAnalytics }[] {
  const raw = dbGetRecentAnalytics(childId, days);
  return raw.map((r) => ({
    date: r.date,
    data: r.data as unknown as DailyAnalytics,
  }));
}

export function computeMoodTrend(
  summaries: { date: string; data: DailyAnalytics }[]
): string {
  if (summaries.length < 2) return "neutral";

  const moodScores: Record<string, number> = {
    happy: 3,
    excited: 3,
    calm: 2,
    neutral: 1,
    worried: -1,
    sad: -2,
    angry: -2,
  };

  const recentHalf = summaries.slice(Math.floor(summaries.length / 2));
  const earlierHalf = summaries.slice(0, Math.floor(summaries.length / 2));

  function avgScore(items: { data: DailyAnalytics }[]): number {
    if (items.length === 0) return 0;
    const total = items.reduce(
      (sum, item) => sum + (moodScores[item.data.dominantMood] || 0),
      0
    );
    return total / items.length;
  }

  const recentAvg = avgScore(recentHalf);
  const earlierAvg = avgScore(earlierHalf);
  const diff = recentAvg - earlierAvg;

  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

export function extractTopTopics(
  summaries: { data: DailyAnalytics }[]
): string[] {
  const topicCounts: Record<string, number> = {};
  for (const s of summaries) {
    for (const topic of s.data.topTopics || []) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }
  return Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([topic]) => topic);
}

export function detectConcerns(
  summaries: { data: DailyAnalytics }[]
): string[] {
  const concerns: string[] = [];

  const recentMoods = summaries.slice(-3).map((s) => s.data.dominantMood);
  const negativeMoods = recentMoods.filter((m) =>
    ["sad", "worried", "angry"].includes(m)
  );

  if (negativeMoods.length >= 2) {
    concerns.push(
      `Persistent negative mood pattern: ${negativeMoods.join(", ")}`
    );
  }

  const avgMessages =
    summaries.reduce((sum, s) => sum + s.data.messageCount, 0) /
    (summaries.length || 1);
  const lastDay = summaries[summaries.length - 1];
  if (lastDay && lastDay.data.messageCount > avgMessages * 2) {
    concerns.push("Unusually high message volume today");
  }

  return concerns;
}
