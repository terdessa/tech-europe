"use client";

import { useState } from "react";
import { OrnateButton, ScrollInput, ScrollTextarea, ParchmentCard } from "@/components/ui/StoryBookUI";

interface MissionFormProps {
  onSubmit: (title: string, description: string) => void;
  loading?: boolean;
}

export default function MissionForm({ onSubmit, loading = false }: MissionFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    onSubmit(title.trim(), description.trim());
    setTitle("");
    setDescription("");
  }

  return (
    <ParchmentCard>
      <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Create a Mission</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <ScrollInput
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Starting school confidence"
          required
        />
        <ScrollTextarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should the character focus on during conversations?"
          required
          rows={3}
        />
        <OrnateButton type="submit" variant="primary" disabled={loading || !title.trim() || !description.trim()} className="w-full">
          {loading ? "Creating..." : "Create Mission"}
        </OrnateButton>
      </form>
    </ParchmentCard>
  );
}
