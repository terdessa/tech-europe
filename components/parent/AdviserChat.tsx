"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { OrnateButton, ParchmentCard, QuillLoading } from "@/components/ui/StoryBookUI";
import type { DustAdviserOutput } from "@/types/api";

interface AdviserMessage {
  role: "parent" | "adviser";
  content: string;
  actions?: string[];
  scripts?: string[];
}

interface AdviserChatProps { childId: string; }

export default function AdviserChat({ childId }: AdviserChatProps) {
  const [messages, setMessages] = useState<AdviserMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "parent", content: question }]);
    setLoading(true);

    try {
      const res = await fetch("/api/adviser", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ childId, question }) });
      if (!res.ok) throw new Error("Adviser request failed");
      const data: DustAdviserOutput = await res.json();
      setMessages((prev) => [...prev, { role: "adviser", content: data.answer, actions: data.suggestedActions, scripts: data.suggestedScripts }]);
    } catch {
      setMessages((prev) => [...prev, { role: "adviser", content: "Sorry, I couldn't process your question right now. Please try again." }]);
    } finally { setLoading(false); }
  }

  return (
    <ParchmentCard className="flex flex-col h-[600px] p-0">
      <div className="p-4 border-b border-gold-500/10">
        <h3 className="font-cinzel font-semibold text-parchment-200">Parent Adviser</h3>
        <p className="text-sm text-parchment-500 font-crimson">Ask questions about your child&apos;s wellbeing and get personalized advice.</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-parchment-500 font-crimson text-sm">Try asking: &quot;How should I approach my child&apos;s anxiety about school?&quot;</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div key={i} className={`flex ${msg.role === "parent" ? "justify-end" : "justify-start"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`max-w-[85%] p-4 rounded-sm ${
              msg.role === "parent"
                ? "bg-gold-500/15 text-parchment-200 border border-gold-500/20"
                : "bg-ink-800/60 border border-gold-500/10"
            }`}>
              <p className="text-sm font-crimson text-parchment-300">{msg.content}</p>

              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gold-500/10">
                  <p className="text-xs font-cinzel font-medium text-forest-400 mb-1">Suggested Actions:</p>
                  <ul className="space-y-1">
                    {msg.actions.map((a, j) => <li key={j} className="text-xs font-crimson text-parchment-400 flex gap-1"><span className="text-forest-400">→</span> {a}</li>)}
                  </ul>
                </div>
              )}

              {msg.scripts && msg.scripts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gold-500/10">
                  <p className="text-xs font-cinzel font-medium text-deep-blue-300 mb-1">Conversation Scripts:</p>
                  {msg.scripts.map((s, j) => <div key={j} className="text-xs font-crimson text-parchment-400 bg-deep-blue-900/20 p-2 rounded-sm mt-1 italic">&ldquo;{s}&rdquo;</div>)}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-ink-800/60 border border-gold-500/10 p-4 rounded-sm">
              <QuillLoading text="Thinking..." />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gold-500/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your child..."
          disabled={loading}
          className="flex-1 bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-sm text-parchment-200 placeholder:text-ink-400 focus:outline-none focus:border-gold-500/50 disabled:opacity-50"
        />
        <OrnateButton type="submit" variant="primary" disabled={loading || !input.trim()}>Ask</OrnateButton>
      </form>
    </ParchmentCard>
  );
}
