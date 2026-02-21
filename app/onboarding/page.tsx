"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { getStoredUser } from "@/lib/auth-client";
import { setUser, createChild } from "@/lib/db-client";
import {
  OrnateButton,
  ScrollInput,
  ParchmentCard,
  InkDivider,
  QuillLoading,
  FloatingParticles,
} from "@/components/ui/StoryBookUI";
import InterestPicker from "@/components/ui/InterestPicker";
import type { CreateCharacterResponse } from "@/types/api";

type Step = "parent" | "child" | "interests" | "character" | "creating";

export default function OnboardingPage() {
  const router = useRouter();
  const { uid, email, setAuth, setChildren } = useAppStore();
  const [step, setStep] = useState<Step>("parent");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) {
      const stored = getStoredUser();
      if (stored) {
        setAuth(stored.uid, stored.email, stored.displayName);
      } else {
        router.replace("/login");
      }
    }
  }, [uid, setAuth, router]);

  const [displayName, setDisplayName] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [interests, setInterests] = useState<string[]>([]);
  const [characterName, setCharacterName] = useState("");

  async function handleParentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    await setUser(uid, {
      email: email || "",
      displayName,
      createdAt: new Date().toISOString(),
    });
    setAuth(uid, email, displayName);
    setStep("child");
  }

  function handleChildSubmit(e: React.FormEvent) {
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

  const stepIndex = { parent: 0, child: 1, interests: 2, character: 3, creating: 3 };
  const stepLabels = ["You", "Child", "Interests", "Character"];

  return (
    <div className="storybook-page flex items-center justify-center min-h-screen p-4 relative">
      <FloatingParticles count={15} />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <motion.h1
            className="text-4xl font-cinzel font-bold gold-shimmer mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            Welcome to Lumio!
          </motion.h1>
          <p className="text-parchment-400 font-crimson">
            Let&apos;s set things up for your family.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-cinzel font-bold border-2 transition-all
                    ${
                      stepIndex[step] === i
                        ? "bg-gold-500 text-ink-900 border-gold-400"
                        : stepIndex[step] > i
                        ? "bg-forest-600 text-parchment-100 border-forest-500"
                        : "bg-ink-800 text-parchment-500 border-ink-600"
                    }`}
                >
                  {stepIndex[step] > i ? "✓" : i + 1}
                </div>
                <span className="text-[10px] font-crimson text-parchment-600">{label}</span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className="w-6 h-0.5 bg-gold-500/20 rounded mb-4" />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === "parent" && (
            <motion.div
              key="parent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ParchmentCard className="p-8">
                <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-4">
                  About You
                </h2>
                <form onSubmit={handleParentSubmit} className="space-y-4">
                  <ScrollInput
                    label="Your Name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    placeholder="What should we call you?"
                  />
                  <OrnateButton type="submit" variant="primary" size="lg" className="w-full">
                    Continue
                  </OrnateButton>
                </form>
              </ParchmentCard>
            </motion.div>
          )}

          {step === "child" && (
            <motion.div
              key="child"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ParchmentCard className="p-8">
                <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-4">
                  About Your Child
                </h2>
                <form onSubmit={handleChildSubmit} className="space-y-4">
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

                  <div className="flex gap-3">
                    <OrnateButton
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("parent")}
                      className="flex-1"
                    >
                      Back
                    </OrnateButton>
                    <OrnateButton type="submit" variant="primary" size="lg" className="flex-1">
                      Continue
                    </OrnateButton>
                  </div>
                </form>
              </ParchmentCard>
            </motion.div>
          )}

          {step === "interests" && (
            <motion.div
              key="interests"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ParchmentCard className="p-8">
                <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-1">
                  What Does {childName || "Your Child"} Love?
                </h2>
                <p className="text-parchment-500 font-crimson text-sm mb-4">
                  This helps us tailor the character&apos;s personality and conversations.
                </p>

                <InkDivider className="mb-4" />

                <InterestPicker selected={interests} onChange={setInterests} />

                <div className="flex gap-3 mt-6">
                  <OrnateButton
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("child")}
                    className="flex-1"
                  >
                    Back
                  </OrnateButton>
                  <OrnateButton
                    variant="primary"
                    size="lg"
                    className="flex-1"
                    onClick={handleInterestsSubmit}
                  >
                    Continue
                  </OrnateButton>
                </div>
              </ParchmentCard>
            </motion.div>
          )}

          {step === "character" && (
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ParchmentCard className="p-8">
                <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-4">
                  Name the Character
                </h2>
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

                  <div className="flex gap-3">
                    <OrnateButton
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("interests")}
                      className="flex-1"
                    >
                      Back
                    </OrnateButton>
                    <OrnateButton type="submit" variant="primary" size="lg" className="flex-1">
                      Create Character
                    </OrnateButton>
                  </div>
                </form>
              </ParchmentCard>
            </motion.div>
          )}

          {step === "creating" && (
            <motion.div
              key="creating"
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
        </AnimatePresence>
      </div>
    </div>
  );
}
