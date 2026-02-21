"use client";

import { useEffect, useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getMissions, addMission, updateMission } from "@/lib/db-client";
import MissionForm from "@/components/parent/MissionForm";
import MissionList from "@/components/parent/MissionList";
import { OrnateButton, ParchmentCard, QuillLoading } from "@/components/ui/StoryBookUI";
import type { Mission } from "@/types/domain";

export default function MissionsPage() {
  const { activeChildId, children } = useAppStore();
  const activeChild = children.find((c) => c.id === activeChildId);
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [creating, setCreating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<{ title: string; description: string }[]>([]);

  const loadMissions = useCallback(async () => {
    if (!activeChildId) return;
    setLoading(true);
    try { setMissions(await getMissions(activeChildId)); }
    catch (err) { console.error("Failed to load missions:", err); }
    finally { setLoading(false); }
  }, [activeChildId]);

  useEffect(() => { loadMissions(); }, [loadMissions]);

  async function handleCreate(title: string, description: string) {
    if (!activeChildId) return;
    setCreating(true);
    try {
      await addMission(activeChildId, { title, description, status: "active", source: "parent" });
      try { await fetch("/api/codewords/mission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ childName: activeChild?.name, missionTitle: title, missionDescription: description, source: "parent" }) }); } catch { /* non-critical */ }
      await loadMissions();
    } finally { setCreating(false); }
  }

  async function handleComplete(missionId: string) {
    if (!activeChildId) return;
    await updateMission(activeChildId, missionId, { status: "completed", completedAt: new Date().toISOString() });
    await loadMissions();
  }

  async function handleSuggest() {
    if (!activeChildId) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/codewords/mission", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "suggest", childId: activeChildId }) });
      if (res.ok) { const data = await res.json(); setSuggestions(data.missions || []); }
    } catch { /* ignore */ }
    finally { setSuggesting(false); }
  }

  async function acceptSuggestion(title: string, description: string) {
    if (!activeChildId) return;
    await addMission(activeChildId, { title, description, status: "active", source: "dust" });
    setSuggestions((prev) => prev.filter((s) => s.title !== title));
    await loadMissions();
  }

  if (loading) return <div className="flex items-center justify-center py-20"><QuillLoading text="Loading missions..." /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Missions</h1>
          {activeChild && <p className="text-parchment-500 font-crimson">Guided activities for {activeChild.name}</p>}
        </div>
        <OrnateButton variant="ghost" onClick={handleSuggest} disabled={suggesting}>
          {suggesting ? "Getting ideas..." : "Suggest Missions"}
        </OrnateButton>
      </div>

      {suggestions.length > 0 && (
        <ParchmentCard className="border-deep-blue-500/30">
          <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-3">AI Suggestions</h3>
          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 bg-ink-800/60 rounded-sm border border-gold-500/10">
                <div className="flex-1">
                  <h4 className="font-cinzel font-medium text-parchment-200 text-sm">{s.title}</h4>
                  <p className="text-xs text-parchment-500 font-crimson mt-0.5">{s.description}</p>
                </div>
                <OrnateButton variant="primary" size="sm" onClick={() => acceptSuggestion(s.title, s.description)}>Accept</OrnateButton>
              </div>
            ))}
          </div>
        </ParchmentCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1"><MissionForm onSubmit={handleCreate} loading={creating} /></div>
        <div className="lg:col-span-2"><ParchmentCard><MissionList missions={missions} onComplete={handleComplete} /></ParchmentCard></div>
      </div>
    </div>
  );
}
