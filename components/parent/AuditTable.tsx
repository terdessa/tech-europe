"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParchmentCard } from "@/components/ui/StoryBookUI";
import type { Message } from "@/types/domain";

const riskColors: Record<string, string> = { LOW: "#6B9660", MEDIUM: "#DEBA48", HIGH: "#A8825C", CRITICAL: "#8B6B4F" };

interface AuditTableProps { messages: Message[]; }

export default function AuditTable({ messages }: AuditTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const auditEntries = messages.filter((m) => m.role === "assistant" && (m.draft || m.dustA || m.dustB || m.flags));

  if (auditEntries.length === 0) {
    return (
      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">Safety Audit Log</h3>
        <p className="text-parchment-500 font-crimson text-sm italic text-center py-8">No audit data yet. Safety audit entries appear after conversations.</p>
      </ParchmentCard>
    );
  }

  return (
    <ParchmentCard className="overflow-hidden">
      <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Safety Audit Log</h3>
      <p className="text-sm text-parchment-500 font-crimson mb-4">Full transparency: see what the AI generated, how it was checked, and any modifications made for safety.</p>

      <div className="space-y-3 max-h-[700px] overflow-y-auto scrollbar-hide">
        {auditEntries.map((msg, i) => {
          const isExpanded = expandedId === (msg.id ?? String(i));
          const wasRewritten = msg.flags?.rewritten;
          const wasEscalated = msg.flags?.escalated;
          const wasInjection = msg.flags?.injectionAttempt;

          return (
            <div key={msg.id ?? i} className="border border-gold-500/10 rounded-sm overflow-hidden">
              <button onClick={() => setExpandedId(isExpanded ? null : msg.id ?? String(i))} className="w-full text-left p-4 hover:bg-ink-800/40 transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  {wasRewritten && <span className="text-xs bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded-full font-cinzel font-medium">Rewritten</span>}
                  {wasEscalated && <span className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded-full font-cinzel font-medium">Escalated</span>}
                  {wasInjection && <span className="text-xs bg-red-900/40 text-red-200 px-2 py-0.5 rounded-full font-cinzel font-medium">Injection Attempt</span>}
                  {!wasRewritten && !wasEscalated && !wasInjection && <span className="text-xs bg-forest-900/30 text-forest-300 px-2 py-0.5 rounded-full font-cinzel font-medium">Clean</span>}
                  {msg.dustB?.riskLevel && <span className="text-xs px-2 py-0.5 rounded-full font-cinzel" style={{ backgroundColor: (riskColors[msg.dustB.riskLevel] || riskColors.LOW) + "15", color: riskColors[msg.dustB.riskLevel] || riskColors.LOW }}>Risk: {msg.dustB.riskLevel}</span>}
                  <span className="flex-1 text-sm text-parchment-300 font-crimson truncate">{(msg.content ?? "").slice(0, 80)}{(msg.content ?? "").length > 80 ? "..." : ""}</span>
                  <span className="text-xs text-parchment-600">{isExpanded ? "▲" : "▼"}</span>
                </div>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="px-4 pb-4 space-y-4">
                      {msg.draft && (
                        <div className="p-3 bg-ink-800/60 rounded-sm border border-gold-500/10">
                          <span className="text-xs font-cinzel font-semibold text-parchment-500 uppercase tracking-wide">Step 1: Gemini Draft</span>
                          <p className="text-sm font-crimson text-parchment-300 mt-2">{msg.draft}</p>
                        </div>
                      )}
                      {msg.dustB && (
                        <div className="p-3 rounded-sm border" style={{ backgroundColor: msg.dustB.isCompliant ? riskColors.LOW + "10" : riskColors.HIGH + "10", borderColor: msg.dustB.isCompliant ? riskColors.LOW + "30" : riskColors.HIGH + "30" }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-cinzel font-semibold text-parchment-500 uppercase tracking-wide">Step 2: Dust Safety Gate</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-cinzel" style={{ backgroundColor: msg.dustB.isCompliant ? riskColors.LOW + "20" : riskColors.HIGH + "20", color: msg.dustB.isCompliant ? riskColors.LOW : riskColors.HIGH }}>
                              {msg.dustB.isCompliant ? "Compliant" : "Non-compliant"}
                            </span>
                          </div>
                          {(msg.dustB.violations ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {(msg.dustB.violations ?? []).map((v, j) => <span key={j} className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded-full">{v}</span>)}
                            </div>
                          )}
                          {msg.dustB.rewriteReason && <p className="text-sm font-crimson text-parchment-300">{msg.dustB.rewriteReason}</p>}
                        </div>
                      )}
                      <div className="p-3 bg-forest-900/20 rounded-sm border border-forest-600/20">
                        <span className="text-xs font-cinzel font-semibold text-parchment-500 uppercase tracking-wide mb-2 block">Step 3: Final Reply (Delivered to Child)</span>
                        <p className="text-sm font-crimson text-parchment-300">{msg.content}</p>
                      </div>
                      {msg.dustA && (
                        <div className="p-3 bg-deep-blue-900/20 rounded-sm border border-deep-blue-600/20">
                          <span className="text-xs font-cinzel font-semibold text-parchment-500 uppercase tracking-wide mb-2 block">Emotion Analysis</span>
                          <div className="grid grid-cols-2 gap-2 text-xs font-crimson">
                            <div><span className="text-parchment-500">Mood:</span> <span className="text-parchment-200 font-medium">{msg.dustA.currentMood}</span></div>
                            <div><span className="text-parchment-500">Confidence:</span> <span className="text-parchment-200 font-medium">{Math.round((msg.dustA.confidence ?? 0) * 100)}%</span></div>
                            <div><span className="text-parchment-500">Tone:</span> <span className="text-parchment-200 font-medium">{msg.dustA.recommendedTone}</span></div>
                            <div><span className="text-parchment-500">Risk:</span> <span className="font-medium" style={{ color: riskColors[msg.dustA.riskLevel] || riskColors.LOW }}>{msg.dustA.riskLevel}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </ParchmentCard>
  );
}
