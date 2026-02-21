"use client";

import { motion } from "framer-motion";
import { OrnateButton } from "@/components/ui/StoryBookUI";
import type { Mission } from "@/types/domain";

interface MissionListProps {
  missions: Mission[];
  onComplete: (missionId: string) => void;
}

export default function MissionList({ missions, onComplete }: MissionListProps) {
  const active = missions.filter((m) => m.status === "active");
  const completed = missions.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Active Missions</h3>
        {active.length === 0 ? (
          <p className="text-parchment-500 font-crimson text-sm italic">No active missions right now.</p>
        ) : (
          <div className="space-y-3">
            {active.map((mission, i) => (
              <motion.div
                key={mission.id}
                className="p-4 bg-ink-800/60 rounded-sm border border-gold-500/10"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-cinzel font-medium text-parchment-200">{mission.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-crimson ${
                        mission.source === "dust"
                          ? "bg-deep-blue-800/50 text-deep-blue-200 border border-deep-blue-600/20"
                          : "bg-forest-900/30 text-forest-300 border border-forest-600/20"
                      }`}>
                        {mission.source === "dust" ? "AI Suggested" : "Parent Created"}
                      </span>
                    </div>
                    <p className="text-sm text-parchment-500 font-crimson">{mission.description}</p>
                  </div>
                  <OrnateButton variant="primary" size="sm" onClick={() => mission.id && onComplete(mission.id)}>
                    ✓ Done
                  </OrnateButton>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Completed</h3>
          <div className="space-y-2">
            {completed.map((mission) => (
              <div key={mission.id} className="p-3 bg-ink-800/30 rounded-sm border border-ink-600/20 opacity-60">
                <h4 className="font-cinzel font-medium text-parchment-500 text-sm line-through">{mission.title}</h4>
                <p className="text-xs text-parchment-600 font-crimson">{mission.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
