"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getAllMessages } from "@/lib/db-client";
import ChatHistoryTable from "@/components/parent/ChatHistoryTable";
import { QuillLoading } from "@/components/ui/StoryBookUI";
import type { Message } from "@/types/domain";

export default function HistoryPage() {
  const { activeChildId, children } = useAppStore();
  const activeChild = children.find((c) => c.id === activeChildId);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadData = useCallback(async () => {
    if (!activeChildId) return;
    setLoading(true);
    try { setMessages(await getAllMessages(activeChildId)); }
    catch (err) { console.error("Failed to load messages:", err); }
    finally { setLoading(false); }
  }, [activeChildId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="flex items-center justify-center py-20"><QuillLoading text="Loading history..." /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Chat History</h1>
        {activeChild && <p className="text-parchment-500 font-crimson">All conversations for {activeChild.name}</p>}
      </div>
      <ChatHistoryTable messages={messages} />
    </div>
  );
}
