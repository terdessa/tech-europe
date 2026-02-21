import { dbGetDailyAnalytics, dbSetDailyAnalytics } from "@/lib/local-db";

export function updateDailyAnalytics(
  childId: string,
  mood: string,
  topics: string[] | undefined | null,
  confidence: number
) {
  const safeTopics = Array.isArray(topics) ? topics : [];
  const today = new Date().toISOString().split("T")[0];
  const existing = dbGetDailyAnalytics(childId, today);

  if (!existing) {
    dbSetDailyAnalytics(childId, today, {
      dominantMood: mood,
      moodBreakdown: { [mood]: 1 },
      topTopics: safeTopics,
      messageCount: 1,
      vocabularyScore: 0,
      curiosityScore: 0,
    });
  } else {
    const moodBreakdown = (existing.moodBreakdown as Record<string, number>) || {};
    moodBreakdown[mood] = (moodBreakdown[mood] || 0) + 1;

    let dominantMood = mood;
    let maxCount = 0;
    for (const [m, count] of Object.entries(moodBreakdown)) {
      if (count > maxCount) {
        maxCount = count;
        dominantMood = m;
      }
    }

    const existingTopics = (existing.topTopics as string[]) || [];
    const mergedTopics = Array.from(
      new Set([...existingTopics, ...safeTopics])
    ).slice(0, 20);

    const curiosityBoost = safeTopics.some((t) =>
      t.toLowerCase().includes("question")
    )
      ? 1
      : 0;

    dbSetDailyAnalytics(childId, today, {
      dominantMood,
      moodBreakdown,
      topTopics: mergedTopics,
      messageCount: ((existing.messageCount as number) || 0) + 1,
      curiosityScore:
        ((existing.curiosityScore as number) || 0) + curiosityBoost,
      vocabularyScore:
        ((existing.vocabularyScore as number) || 0) +
        (confidence > 0.7 ? 1 : 0),
    });
  }
}
