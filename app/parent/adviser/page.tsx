"use client";

import { useAppStore } from "@/store/useAppStore";
import AdviserChat from "@/components/parent/AdviserChat";
import { ParchmentCard } from "@/components/ui/StoryBookUI";

export default function AdviserPage() {
  const { activeChildId, children } = useAppStore();
  const activeChild = children.find((c) => c.id === activeChildId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Parent Adviser</h1>
        {activeChild && <p className="text-parchment-500 font-crimson">Get personalized guidance for {activeChild.name}</p>}
      </div>
      {activeChildId ? (
        <AdviserChat childId={activeChildId} />
      ) : (
        <ParchmentCard className="p-12 text-center">
          <p className="text-parchment-500 font-crimson">Please select a child to get started with the adviser.</p>
        </ParchmentCard>
      )}
    </div>
  );
}
