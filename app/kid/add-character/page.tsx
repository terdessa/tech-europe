"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { createChild } from "@/lib/db-client";
import {
  OrnateButton,
  ScrollInput,
  ParchmentCard,
  InkDivider,
  QuillLoading,
  FloatingParticles,
  IllustratedHeader,
} from "@/components/ui/StoryBookUI";
import type { CreateCharacterResponse } from "@/types/api";

type FormStep = "form" | "creating";

export default function AddCharacterPage() {
  const router = useRouter();
  const { uid, setChildren } = useAppStore();
  const [step, setStep] = useState<FormStep>("form");
  const [error, setError] = useState("");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [characterName, setCharacterName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setError("");
    setStep("creating");

    try {
      const res = await fetch("/api/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childName, childAge, characterName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create character");
      }

      const data: CreateCharacterResponse = await res.json();

      await createChild({
        parentId: uid,
        name: childName,
        age: childAge,
        characterName,
        characterInfo: data.characterInfo,
        characterImageUrl: data.characterImageUrl,
      });

      const { getChildrenForParent } = await import("@/lib/db-client");
      const kids = await getChildrenForParent(uid);
      setChildren(kids);

      router.push("/kid/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    }
  }

  return (
    <div className="storybook-page min-h-screen relative">
      <FloatingParticles count={12} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gold-500/10">
        <h1 className="font-cinzel font-bold text-xl">
          <span className="gold-shimmer">LUMIO</span>
        </h1>
        <button
          onClick={() => router.push("/kid/library")}
          className="font-cinzel text-sm text-parchment-300 hover:text-gold-400 transition-colors"
        >
          ← Back to Library
        </button>
      </nav>

      <div className="relative z-10 max-w-lg mx-auto px-6 py-8">
        <IllustratedHeader title="Add a Character" subtitle="Create a new story friend!" />

        {step === "form" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <ParchmentCard className="p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <ScrollInput
                  label="Child's Name"
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  required
                  placeholder="Your child's first name"
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">
                    Age
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={2}
                      max={12}
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="flex-1 accent-gold-500"
                    />
                    <span className="text-2xl font-cinzel font-bold text-gold-400 w-10 text-center">
                      {childAge}
                    </span>
                  </div>
                </div>

                <ScrollInput
                  label="Character Name"
                  type="text"
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  required
                  placeholder="Name the storybook character (e.g., Sparky, Luna)"
                />
                <p className="text-xs text-parchment-600 font-crimson -mt-2">
                  We&apos;ll create a unique, safe character inspired by this name.
                </p>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-sm p-3">
                    <p className="text-red-300 text-sm font-crimson">{error}</p>
                  </div>
                )}

                <InkDivider />

                <div className="flex gap-3">
                  <OrnateButton
                    type="button"
                    variant="ghost"
                    onClick={() => router.push("/kid/library")}
                    className="flex-1"
                  >
                    Cancel
                  </OrnateButton>
                  <OrnateButton type="submit" variant="primary" size="lg" className="flex-1">
                    Create Character
                  </OrnateButton>
                </div>
              </form>
            </ParchmentCard>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ParchmentCard className="p-12 text-center">
              <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-3">
                Creating {characterName || "your character"}...
              </h2>
              <p className="text-parchment-400 font-crimson mb-6">
                Our storybook workshop is bringing your character to life!
              </p>
              <QuillLoading text="Inscribing character..." />
            </ParchmentCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}
