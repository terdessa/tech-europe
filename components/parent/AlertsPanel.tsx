"use client";

import { ParchmentCard } from "@/components/ui/StoryBookUI";
import type { Alert } from "@/types/domain";

const riskColors: Record<string, string> = {
  LOW: "#6B9660",
  MEDIUM: "#DEBA48",
  HIGH: "#A8825C",
  CRITICAL: "#8B6B4F",
};

interface AlertsPanelProps { alerts: Alert[]; }

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Recent Alerts</h3>
        <p className="text-parchment-500 font-crimson text-sm italic text-center py-4">No alerts — everything looks good!</p>
      </ParchmentCard>
    );
  }

  return (
    <ParchmentCard>
      <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Recent Alerts</h3>
      <div className="space-y-3">
        {alerts.slice(0, 5).map((alert, i) => (
          <div key={alert.id ?? i} className="flex items-start gap-3 p-3 rounded-sm bg-ink-800/60 border border-gold-500/10">
            <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: riskColors[alert.riskLevel] || riskColors.LOW }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-cinzel font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: (riskColors[alert.riskLevel] || riskColors.LOW) + "20", color: riskColors[alert.riskLevel] || riskColors.LOW }}>
                  {alert.riskLevel}
                </span>
                <span className="text-xs text-parchment-500 font-crimson">{(alert.categories ?? []).join(", ")}</span>
              </div>
              <p className="text-sm text-parchment-300 font-crimson">{alert.summary}</p>
            </div>
          </div>
        ))}
      </div>
    </ParchmentCard>
  );
}
