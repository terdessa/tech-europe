"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import InterestPicker from "@/components/ui/InterestPicker";
import type { CreateCharacterResponse } from "@/types/api";

type FormStep = "info" | "interests" | "character" | "creating";

export default function AddCharacterPage() {
  const router = useRouter();
  const { uid, setChildren } = useAppStore();
  const [step, setStep] = useState<FormStep>("info");
  const [error, setError] = useState("");

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [interests, setInterests] = useState<string[]>([]);
  const [characterName, setCharacterName] = useState("");

  function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("interests");
  }

  function handleInterestsSubmit() {
    setStep("character");
  }

  async function handleCharacterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setError("");
    setStep("creating");

    try {
      const res = await fetch("/api/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName,
          childAge,
          childInterests: interests,
          characterName,
        }),
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
        interests,
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
      setStep("character");
    }
  }

  return (
    <div className="storybook-page min-h-screen relative">
      <FloatingParticles count={12} />

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

        <AnimatePresence mode="wait">
          {step === "info" && (
            <motion.div key="info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ParchmentCard className="p-8">
                <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">About the Child</h3>
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                  <ScrollInput
                    label="Child's Name"
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    required
                    placeholder="Your child's first name"
                  />

                  <div className="space-y-1.5">
                    <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">Age</label>
                    <div className="flex items-center gap-4">
                      <input type="range" min={2} max={12} value={childAge} onChange={(e) => setChildAge(Number(e.target.value))} className="flex-1 accent-gold-500" />
                      <span className="text-2xl font-cinzel font-bold text-gold-400 w-10 text-center">{childAge}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <OrnateButton type="button" variant="ghost" onClick={() => router.push("/kid/library")} className="flex-1">Cancel</OrnateButton>
                    <OrnateButton type="submit" variant="primary" size="lg" className="flex-1">Continue</OrnateButton>
                  </div>
                </form>
              </ParchmentCard>
            </motion.div>
          )}

          {step === "interests" && (
            <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ParchmentCard className="p-8">
                <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-1">
                  What Does {childName || "Your Child"} Love?
                </h3>
                <p className="text-parchment-500 font-crimson text-sm mb-4">
                  This shapes the character&apos;s personality and conversations.
                </p>
                <InkDivider className="mb-4" />
                <InterestPicker selected={interests} onChange={setInterests} />
                <div className="flex gap-3 mt-6">
                  <OrnateButton type="button" variant="ghost" onClick={() => setStep("info")} className="flex-1">Back</OrnateButton>
                  <OrnateButton variant="primary" size="lg" className="flex-1" onClick={handleInterestsSubmit}>Continue</OrnateButton>
                </div>
              </ParchmentCard>
            </motion.div>
          )}

          {step === "character" && (
            <motion.div key="character" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ParchmentCard className="p-8">
                <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Name the Character</h3>
                <form onSubmit={handleCharacterSubmit} className="space-y-4">
                  <ScrollInput
                    label="Character Name"
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    required
                    placeholder="Name the storybook character (e.g., Sparky, Luna)"
                  />
                  <p className="text-xs text-parchment-600 font-crimson -mt-2">
                    We&apos;ll create a unique, safe character inspired by this name
                    {interests.length > 0 && ` who shares ${childName}'s love of ${interests.slice(0, 3).join(", ")}`}.
                  </p>

                  {error && (
                    <div className="bg-red-900/30 border border-red-500/30 rounded-sm p-3">
                      <p className="text-red-300 text-sm font-crimson">{error}</p>
                    </div>
                  )}

                  <InkDivider />

                  <div className="flex gap-3">
                    <OrnateButton type="button" variant="ghost" onClick={() => setStep("interests")} className="flex-1">Back</OrnateButton>
                    <OrnateButton type="submit" variant="primary" size="lg" className="flex-1">Create Character</OrnateButton>
                  </div>
                </form>
              </ParchmentCard>
            </motion.div>
          )}

          {step === "creating" && (
            <motion.div key="creating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
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
        </AnimatePresence>
      </div>
    </div>
  );
}
