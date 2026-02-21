"use client";

import { ParchmentCard } from "@/components/ui/StoryBookUI";

interface WeeklyInsightCardProps {
  narrative?: string;
  highlights?: string[];
  concerns?: string[];
}

export default function WeeklyInsightCard({ narrative, highlights = [], concerns = [] }: WeeklyInsightCardProps) {
  return (
    <ParchmentCard>
      <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Weekly Insights</h3>
      {narrative ? (
        <p className="text-parchment-400 font-crimson text-sm mb-4">{narrative}</p>
      ) : (
        <p className="text-parchment-500 font-crimson text-sm italic mb-4">Insights will appear after a few days of conversation.</p>
      )}

      {highlights.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-cinzel font-medium text-forest-400 mb-1">Highlights</h4>
          <ul className="space-y-1">
            {highlights.map((h, i) => (
              <li key={i} className="text-sm font-crimson text-parchment-400 flex gap-2">
                <span className="text-forest-400">•</span> {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {concerns.length > 0 && (
        <div>
          <h4 className="text-sm font-cinzel font-medium text-red-400 mb-1">Areas to Watch</h4>
          <ul className="space-y-1">
            {concerns.map((c, i) => (
              <li key={i} className="text-sm font-crimson text-parchment-400 flex gap-2">
                <span className="text-red-400">•</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ParchmentCard>
  );
}
