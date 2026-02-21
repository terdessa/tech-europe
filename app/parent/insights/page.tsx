"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getRecentDailyAnalytics } from "@/lib/db-client";
import MoodTrendChart from "@/components/parent/MoodTrendChart";
import { ParchmentCard, QuillLoading } from "@/components/ui/StoryBookUI";
import type { DailyAnalytics } from "@/types/domain";

export default function InsightsPage() {
  const { activeChildId, children } = useAppStore();
  const activeChild = children.find((c) => c.id === activeChildId);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ date: string; data: DailyAnalytics }[]>([]);

  const loadData = useCallback(async () => {
    if (!activeChildId) return;
    setLoading(true);
    try {
      const analytics = await getRecentDailyAnalytics(activeChildId, 30);
      setData(analytics);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  }, [activeChildId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <QuillLoading text="Loading insights..." />
      </div>
    );
  }

  const chartData = data.map(({ date, data: d }) => ({
    date,
    happy: d.moodBreakdown?.happy || 0,
    calm: d.moodBreakdown?.calm || 0,
    worried: d.moodBreakdown?.worried || 0,
    sad: d.moodBreakdown?.sad || 0,
    excited: d.moodBreakdown?.excited || 0,
    angry: d.moodBreakdown?.angry || 0,
    neutral: d.moodBreakdown?.neutral || 0,
  }));

  const topicCounts: Record<string, number> = {};
  for (const { data: d } of data) {
    for (const topic of d.topTopics || []) {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    }
  }
  const topTopics = Object.entries(topicCounts).sort(([, a], [, b]) => b - a).slice(0, 15);

  const positiveHighlights: string[] = [];
  const totalMessages = data.reduce((sum, d) => sum + d.data.messageCount, 0);
  if (totalMessages > 0) positiveHighlights.push(`${totalMessages} messages exchanged over ${data.length} days`);
  const happyDays = data.filter((d) => d.data.dominantMood === "happy" || d.data.dominantMood === "excited").length;
  if (happyDays > 0) positiveHighlights.push(`${happyDays} days with positive dominant mood`);
  const avgVocab = data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.data.vocabularyScore, 0) / data.length) : 0;
  if (avgVocab > 0) positiveHighlights.push(`Average vocabulary score: ${avgVocab}`);

  const negativeMoodDays = data.filter((d) => ["sad", "worried", "angry"].includes(d.data.dominantMood));
  const triggers = negativeMoodDays.flatMap((d) => d.data.topTopics || []);
  const triggerCounts: Record<string, number> = {};
  for (const t of triggers) triggerCounts[t] = (triggerCounts[t] || 0) + 1;
  const topTriggers = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Insights</h1>
        {activeChild && <p className="text-parchment-500 font-crimson">30-day trends for {activeChild.name}</p>}
      </div>

      <MoodTrendChart data={chartData} title="Mood Trends (30 Days)" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ParchmentCard>
          <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Topic Timeline</h3>
          {topTopics.length === 0 ? (
            <p className="text-parchment-500 font-crimson text-sm italic">No topics recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topTopics.map(([topic, count]) => (
                <span key={topic} className="bg-deep-blue-800/50 text-deep-blue-200 px-3 py-1 rounded-full text-sm font-crimson border border-deep-blue-600/20">
                  {topic} <span className="text-xs opacity-60">({count})</span>
                </span>
              ))}
            </div>
          )}
        </ParchmentCard>

        <ParchmentCard>
          <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Positive Highlights</h3>
          {positiveHighlights.length === 0 ? (
            <p className="text-parchment-500 font-crimson text-sm italic">Highlights will appear with more data.</p>
          ) : (
            <ul className="space-y-2">
              {positiveHighlights.map((h, i) => (
                <li key={i} className="text-sm font-crimson text-parchment-400 flex gap-2">
                  <span className="text-forest-400">✓</span> {h}
                </li>
              ))}
            </ul>
          )}
        </ParchmentCard>
      </div>

      {topTriggers.length > 0 && (
        <ParchmentCard>
          <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Trigger Map</h3>
          <p className="text-sm text-parchment-500 font-crimson mb-3">Topics associated with negative mood days:</p>
          <div className="flex flex-wrap gap-2">
            {topTriggers.map(([trigger, count]) => (
              <span key={trigger} className="bg-red-900/30 text-red-300 px-3 py-1 rounded-full text-sm font-crimson border border-red-500/20">
                {trigger} <span className="text-xs opacity-60">({count})</span>
              </span>
            ))}
          </div>
        </ParchmentCard>
      )}
    </div>
  );
}
