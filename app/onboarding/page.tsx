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
import type { CreateCharacterResponse } from "@/types/api";

type Step = "parent" | "child" | "creating";

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

  async function handleChildSubmit(e: React.FormEvent) {
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
      setStep("child");
    }
  }

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
        <div className="flex items-center justify-center gap-3 mb-8">
          {["parent", "child"].map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-cinzel font-bold border-2 transition-all
                  ${
                    step === s || (step === "creating" && s === "child")
                      ? "bg-gold-500 text-ink-900 border-gold-400"
                      : i === 0 && step !== "parent"
                      ? "bg-forest-600 text-parchment-100 border-forest-500"
                      : "bg-ink-800 text-parchment-500 border-ink-600"
                  }`}
              >
                {i === 0 && step !== "parent" ? "✓" : i + 1}
              </div>
              {i < 1 && (
                <div className="w-12 h-0.5 bg-gold-500/20 rounded" />
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
                  Your Child&apos;s Companion
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
