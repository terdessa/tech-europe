"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { getChildrenForParent, updateChild } from "@/lib/db-client";
import { ParchmentCard, OrnateButton } from "@/components/ui/StoryBookUI";
import type { Child, CommunicationLevel, PersonalityType } from "@/types/domain";

const COMMUNICATION_LEVELS: { value: CommunicationLevel; label: string }[] = [
  { value: "early", label: "Early" },
  { value: "developing", label: "Developing" },
  { value: "fluent", label: "Fluent" },
];

const PERSONALITY_TYPES: { value: PersonalityType; label: string }[] = [
  { value: "shy", label: "Shy" },
  { value: "outgoing", label: "Outgoing" },
  { value: "curious", label: "Curious" },
  { value: "creative", label: "Creative" },
  { value: "calm", label: "Calm" },
];

function parseList(s: string): string[] {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatList(arr: string[] | undefined): string {
  return arr?.join(", ") ?? "";
}

export default function KidDetailsPage() {
  const { uid, activeChildId, children, setChildren } = useAppStore();
  const activeChild = children.find((c) => c.id === activeChildId);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [interestsStr, setInterestsStr] = useState("");
  const [language, setLanguage] = useState("");
  const [communicationLevel, setCommunicationLevel] = useState<CommunicationLevel | "">("");
  const [personalityType, setPersonalityType] = useState<PersonalityType | "">("");
  const [sensitivitiesStr, setSensitivitiesStr] = useState("");
  const [favoriteColor, setFavoriteColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (activeChild) {
      setName(activeChild.name);
      setAge(String(activeChild.age));
      setInterestsStr(formatList(activeChild.interests));
      setLanguage(activeChild.language ?? "");
      setCommunicationLevel(activeChild.communicationLevel ?? "");
      setPersonalityType(activeChild.personalityType ?? "");
      setSensitivitiesStr(formatList(activeChild.sensitivities));
      setFavoriteColor(activeChild.favoriteColor ?? "");
    }
  }, [activeChild]);

  async function handleSave() {
    if (!uid || !activeChildId || !activeChild) return;
    const ageNum = parseInt(age, 10);
    if (Number.isNaN(ageNum) || ageNum < 0 || ageNum > 18) {
      setError("Please enter a valid age (0–18)");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateChild(activeChildId, uid, {
        name: name.trim() || activeChild.name,
        age: ageNum,
        interests: parseList(interestsStr),
        language: language.trim() || undefined,
        communicationLevel: communicationLevel || undefined,
        personalityType: personalityType || undefined,
        sensitivities: parseList(sensitivitiesStr).length > 0 ? parseList(sensitivitiesStr) : undefined,
        favoriteColor: favoriteColor.trim() || undefined,
      });
      const updated = await getChildrenForParent(uid);
      setChildren(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (!activeChild && children.length > 0) {
    return (
      <div className="text-center py-12 text-parchment-500 font-crimson">
        Select a child from the dropdown above.
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12 text-parchment-500 font-crimson">
        No children yet. Add a character from the kid view first.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Kid details</h1>
        <p className="text-parchment-500 font-crimson">
          Update info for {activeChild?.name}. Character name and story stay in the kid view.
        </p>
      </div>

      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">Age</label>
            <input
              type="number"
              min={0}
              max={18}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">
              Interests (comma-separated)
            </label>
            <input
              type="text"
              value={interestsStr}
              onChange={(e) => setInterestsStr(e.target.value)}
              placeholder="e.g. dinosaurs, space, drawing"
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">Language (optional)</label>
            <input
              type="text"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="e.g. English"
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">Communication level</label>
            <select
              value={communicationLevel}
              onChange={(e) => setCommunicationLevel(e.target.value as CommunicationLevel | "")}
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 focus:outline-none focus:border-gold-500/50"
            >
              <option value="">—</option>
              {COMMUNICATION_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">Personality type</label>
            <select
              value={personalityType}
              onChange={(e) => setPersonalityType(e.target.value as PersonalityType | "")}
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 focus:outline-none focus:border-gold-500/50"
            >
              <option value="">—</option>
              {PERSONALITY_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">
              Sensitivities (comma-separated, optional)
            </label>
            <input
              type="text"
              value={sensitivitiesStr}
              onChange={(e) => setSensitivitiesStr(e.target.value)}
              placeholder="e.g. loud noises, dark"
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-crimson text-parchment-400 mb-1">Favorite color (optional)</label>
            <input
              type="text"
              value={favoriteColor}
              onChange={(e) => setFavoriteColor(e.target.value)}
              placeholder="e.g. blue"
              className="w-full bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 placeholder:text-ink-500 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>
      </ParchmentCard>

      {error && <p className="text-red-400 text-sm font-crimson">{error}</p>}

      <OrnateButton variant="primary" onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : saved ? "Saved!" : "Save changes"}
      </OrnateButton>
    </div>
  );
}
