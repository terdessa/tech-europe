"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getAllMessages } from "@/lib/db-client";
import AuditTable from "@/components/parent/AuditTable";
import { QuillLoading } from "@/components/ui/StoryBookUI";
import type { Message } from "@/types/domain";

export default function AuditPage() {
  const { activeChildId, children } = useAppStore();
  const activeChild = children.find((c) => c.id === activeChildId);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadData = useCallback(async () => {
    if (!activeChildId) return;
    setLoading(true);
    try { setMessages(await getAllMessages(activeChildId)); }
    catch (err) { console.error("Failed to load audit data:", err); }
    finally { setLoading(false); }
  }, [activeChildId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="flex items-center justify-center py-20"><QuillLoading text="Loading audit data..." /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Safety Audit</h1>
        {activeChild && (
          <p className="text-parchment-500 font-crimson">
            Full transparency for {activeChild.name}&apos;s conversations — see every step of the AI safety pipeline.
          </p>
        )}
      </div>
      <AuditTable messages={messages} />
    </div>
  );
}
