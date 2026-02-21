"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ParchmentCard } from "@/components/ui/StoryBookUI";
import type { Message } from "@/types/domain";

interface ChatHistoryTableProps { messages: Message[]; }

export default function ChatHistoryTable({ messages }: ChatHistoryTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterMood, setFilterMood] = useState<string>("");
  const [filterFlag, setFilterFlag] = useState<string>("");

  const filtered = messages.filter((msg) => {
    if (filterMood && msg.mood !== filterMood) return false;
    if (filterFlag === "rewritten" && !msg.flags?.rewritten) return false;
    if (filterFlag === "escalated" && !msg.flags?.escalated) return false;
    if (filterFlag === "injection" && !msg.flags?.injectionAttempt) return false;
    return true;
  });

  const uniqueMoods = Array.from(new Set(messages.map((m) => m.mood).filter(Boolean)));

  return (
    <ParchmentCard className="overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200">Chat History</h3>
        <div className="flex gap-2">
          <select value={filterMood} onChange={(e) => setFilterMood(e.target.value)}
            className="text-sm bg-ink-800 border border-gold-500/20 rounded-sm px-3 py-1.5 font-crimson text-parchment-300">
            <option value="">All moods</option>
            {uniqueMoods.map((m) => <option key={m} value={m!}>{m}</option>)}
          </select>
          <select value={filterFlag} onChange={(e) => setFilterFlag(e.target.value)}
            className="text-sm bg-ink-800 border border-gold-500/20 rounded-sm px-3 py-1.5 font-crimson text-parchment-300">
            <option value="">All flags</option>
            <option value="rewritten">Rewritten</option>
            <option value="escalated">Escalated</option>
            <option value="injection">Injection attempt</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-hide">
        {filtered.length === 0 ? (
          <p className="text-parchment-500 font-crimson text-sm italic text-center py-8">No messages match the current filters.</p>
        ) : filtered.map((msg, i) => {
          const isExpanded = expandedId === (msg.id ?? String(i));
          return (
            <div key={msg.id ?? i}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : msg.id ?? String(i))}
                className="w-full text-left p-3 rounded-sm bg-ink-800/60 border border-gold-500/10 hover:bg-ink-800/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-cinzel font-medium px-2 py-0.5 rounded-full ${
                    msg.role === "kid" ? "bg-gold-500/20 text-gold-400" : "bg-ink-700 text-parchment-400"
                  }`}>{msg.role === "kid" ? "Child" : "Character"}</span>
                  {msg.mood && <span className="text-xs text-parchment-500 font-crimson">{msg.mood}</span>}
                  {msg.flags?.rewritten && <span className="text-xs bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded-full font-cinzel">Rewritten</span>}
                  {msg.flags?.escalated && <span className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded-full font-cinzel">Escalated</span>}
                  <span className="flex-1 text-sm text-parchment-300 font-crimson truncate">{msg.content}</span>
                </div>
              </button>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 bg-ink-800/40 border border-gold-500/10 rounded-b-sm space-y-2">
                      <p className="text-sm font-crimson text-parchment-300">{msg.content}</p>
                      {msg.topics && msg.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {msg.topics.map((t) => <span key={t} className="text-xs bg-deep-blue-800/50 text-deep-blue-200 px-2 py-0.5 rounded-full font-crimson border border-deep-blue-600/20">{t}</span>)}
                        </div>
                      )}
                      {msg.draft && (
                        <div className="p-2 bg-ink-800/60 rounded-sm">
                          <span className="text-xs font-cinzel text-parchment-500">Original draft:</span>
                          <p className="text-sm font-crimson text-parchment-400 mt-1">{msg.draft}</p>
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
