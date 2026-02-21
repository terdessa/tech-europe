"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { CreateCharacterResponse, AnalyzeMediaResponse } from "@/types/api";
import type { CommunicationLevel, PersonalityType, CharacterGender } from "@/types/domain";

type FormStep = "info" | "interests" | "character" | "creating";
type CharacterMode = "custom" | "media";

const PERSONALITY_OPTIONS: { value: PersonalityType; label: string; emoji: string }[] = [
  { value: "shy", label: "Shy", emoji: "🤫" },
  { value: "outgoing", label: "Outgoing", emoji: "🗣️" },
  { value: "curious", label: "Curious", emoji: "🔍" },
  { value: "creative", label: "Creative", emoji: "🎨" },
  { value: "calm", label: "Calm", emoji: "🧘" },
];

const COMM_LEVELS: { value: CommunicationLevel; label: string; desc: string }[] = [
  { value: "early", label: "Just learning to talk", desc: "Ages 2-4, simple words" },
  { value: "developing", label: "Can hold a conversation", desc: "Ages 4-8, full sentences" },
  { value: "fluent", label: "Reads and writes well", desc: "Ages 8-12, complex thoughts" },
];

const SENSITIVITY_OPTIONS = [
  "Divorce", "Death", "Violence", "Scary things", "Loneliness",
  "Bullying", "Moving away", "Hospital", "Darkness",
];

export default function AddCharacterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isQuick = searchParams.get("quick") === "1";
  const { uid, setChildren } = useAppStore();
  const [step, setStep] = useState<FormStep | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step === null) setStep(isQuick ? "character" : "info");
  }, [isQuick, step]);

  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [communicationLevel, setCommunicationLevel] = useState<CommunicationLevel>("developing");
  const [personalityType, setPersonalityType] = useState<PersonalityType>("curious");
  const [sensitivities, setSensitivities] = useState<string[]>([]);
  const [favoriteColor, setFavoriteColor] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  const [characterMode, setCharacterMode] = useState<CharacterMode>("custom");
  const [characterName, setCharacterName] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<"cartoon" | "movie" | "book" | "game">("cartoon");
  const [mediaCharacters, setMediaCharacters] = useState<AnalyzeMediaResponse["characters"]>([]);
  const [selectedMediaChars, setSelectedMediaChars] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function handleInfoSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("interests");
  }

  function handleInterestsSubmit() {
    setStep("character");
  }

  function toggleSensitivity(s: string) {
    setSensitivities((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  async function handleAnalyzeMedia() {
    if (!mediaTitle.trim()) return;
    setIsAnalyzing(true);
    setError("");
    try {
      const res = await fetch("/api/character/analyze-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaTitle, mediaType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to analyze media");
      }
      const data: AnalyzeMediaResponse = await res.json();
      setMediaCharacters(data.characters);
      setSelectedMediaChars(new Set(data.characters.map((_, i) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function toggleMediaChar(idx: number) {
    setSelectedMediaChars((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  async function createSingleCharacter(
    name: string,
    gender?: CharacterGender,
    overrideChildName?: string,
    overrideChildAge?: number,
    overrideInterests?: string[]
  ) {
    const res = await fetch("/api/character/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childName: overrideChildName ?? childName,
        childAge: overrideChildAge ?? childAge,
        childInterests: overrideInterests ?? interests,
        characterName: name,
        characterGender: gender,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to create character");
    }
    return (await res.json()) as CreateCharacterResponse;
  }

  async function handleCharacterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    setError("");
    setStep("creating");

    const effectiveChildAge = isQuick ? 6 : childAge;
    const effectiveInterests = isQuick ? [] : interests;
    const effectiveChildNameForApi = isQuick
      ? (characterMode === "custom" ? characterName : "Child")
      : childName;

    try {
      const childBase = {
        parentId: uid,
        age: effectiveChildAge,
        interests: effectiveInterests,
        communicationLevel,
        personalityType,
        sensitivities,
        favoriteColor: favoriteColor || undefined,
      };

      if (characterMode === "custom") {
        const data = await createSingleCharacter(characterName, undefined, effectiveChildNameForApi, effectiveChildAge, effectiveInterests);
        await createChild({
          ...childBase,
          name: isQuick ? characterName : childName,
          characterName,
          characterInfo: data.characterInfo,
          characterImageUrl: data.characterImageUrl,
        });
      } else {
        const selected = Array.from(selectedMediaChars);
        for (const idx of selected) {
          const mc = mediaCharacters[idx];
          const data = await createSingleCharacter(mc.name, mc.gender, effectiveChildNameForApi, effectiveChildAge, effectiveInterests);
          await createChild({
            ...childBase,
            name: isQuick ? mc.name : childName,
            characterName: mc.name,
            characterInfo: data.characterInfo,
            characterImageUrl: data.characterImageUrl,
          });
        }
      }

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
        <IllustratedHeader
          title="Add a Character"
          subtitle={isQuick ? "Type a character name or pick from a cartoon, movie, or book." : "Create a new story friend!"}
        />

        <AnimatePresence mode="wait">
          {step === null && (
            <motion.div key="init" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-12">
              <QuillLoading text="Loading..." />
            </motion.div>
          )}
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

                  <InkDivider className="my-1" />

                  <div className="space-y-2">
                    <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">Communication Level</label>
                    <div className="grid gap-2">
                      {COMM_LEVELS.map((cl) => (
                        <button
                          key={cl.value}
                          type="button"
                          onClick={() => setCommunicationLevel(cl.value)}
                          className={`text-left p-3 rounded-sm border transition-all ${
                            communicationLevel === cl.value
                              ? "bg-gold-500/15 border-gold-500/40 text-parchment-200"
                              : "bg-ink-800/40 border-ink-600/30 text-parchment-400 hover:border-gold-500/20"
                          }`}
                        >
                          <span className="font-crimson text-sm font-semibold">{cl.label}</span>
                          <span className="block font-crimson text-xs text-parchment-500 mt-0.5">{cl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">Personality</label>
                    <div className="flex flex-wrap gap-2">
                      {PERSONALITY_OPTIONS.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setPersonalityType(p.value)}
                          className={`px-3 py-1.5 rounded-full text-sm font-crimson transition-all border ${
                            personalityType === p.value
                              ? "bg-gold-500/20 border-gold-500/40 text-gold-300"
                              : "bg-ink-800/40 border-ink-600/30 text-parchment-400 hover:border-gold-500/20"
                          }`}
                        >
                          {p.emoji} {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">Topics to Avoid</label>
                    <p className="text-xs text-parchment-500 font-crimson -mt-1">Select any sensitive topics the character should steer clear of</p>
                    <div className="flex flex-wrap gap-2">
                      {SENSITIVITY_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSensitivity(s)}
                          className={`px-3 py-1 rounded-full text-xs font-crimson transition-all border ${
                            sensitivities.includes(s)
                              ? "bg-red-900/30 border-red-500/40 text-red-300"
                              : "bg-ink-800/40 border-ink-600/30 text-parchment-400 hover:border-red-500/20"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <ScrollInput
                    label="Favorite Color (optional)"
                    type="text"
                    value={favoriteColor}
                    onChange={(e) => setFavoriteColor(e.target.value)}
                    placeholder="e.g., Blue, Purple, Rainbow"
                  />

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
                <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Create a Character</h3>

                <div className="flex mb-6 border border-ink-600/30 rounded-sm overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCharacterMode("custom")}
                    className={`flex-1 py-2.5 text-sm font-cinzel font-medium transition-all ${
                      characterMode === "custom"
                        ? "bg-gold-500/20 text-gold-300 border-b-2 border-gold-500"
                        : "bg-ink-800/40 text-parchment-400 hover:text-parchment-300"
                    }`}
                  >
                    Custom Name
                  </button>
                  <button
                    type="button"
                    onClick={() => setCharacterMode("media")}
                    className={`flex-1 py-2.5 text-sm font-cinzel font-medium transition-all ${
                      characterMode === "media"
                        ? "bg-gold-500/20 text-gold-300 border-b-2 border-gold-500"
                        : "bg-ink-800/40 text-parchment-400 hover:text-parchment-300"
                    }`}
                  >
                    From a Movie / Book
                  </button>
                </div>

                {characterMode === "custom" ? (
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
                      {!isQuick && interests.length > 0 && ` who shares ${childName}'s love of ${interests.slice(0, 3).join(", ")}`}.
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
                        onClick={() => (isQuick ? router.push("/kid/library") : setStep("interests"))}
                        className="flex-1"
                      >
                        Back
                      </OrnateButton>
                      <OrnateButton type="submit" variant="primary" size="lg" className="flex-1">Create Character</OrnateButton>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value as typeof mediaType)}
                        className="bg-ink-800/80 border border-gold-500/20 rounded-sm px-3 py-2.5 font-crimson text-parchment-300 text-sm focus:outline-none focus:border-gold-500/50"
                      >
                        <option value="cartoon">Cartoon</option>
                        <option value="movie">Movie</option>
                        <option value="book">Book</option>
                        <option value="game">Game</option>
                      </select>
                      <div className="flex-1">
                        <ScrollInput
                          label=""
                          type="text"
                          value={mediaTitle}
                          onChange={(e) => setMediaTitle(e.target.value)}
                          placeholder="e.g., Frozen, Harry Potter, Paw Patrol..."
                        />
                      </div>
                    </div>

                    <OrnateButton
                      type="button"
                      variant="primary"
                      className="w-full"
                      onClick={handleAnalyzeMedia}
                      disabled={isAnalyzing || !mediaTitle.trim()}
                    >
                      {isAnalyzing ? "Analyzing..." : "Find Characters"}
                    </OrnateButton>

                    {mediaCharacters.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-cinzel text-parchment-300">Select characters to create:</p>
                        {mediaCharacters.map((mc, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => toggleMediaChar(i)}
                            className={`w-full text-left p-3 rounded-sm border transition-all ${
                              selectedMediaChars.has(i)
                                ? "bg-gold-500/15 border-gold-500/40"
                                : "bg-ink-800/40 border-ink-600/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center ${
                                selectedMediaChars.has(i) ? "bg-gold-500 border-gold-400" : "border-ink-500"
                              }`}>
                                {selectedMediaChars.has(i) && <span className="text-ink-900 text-xs font-bold">✓</span>}
                              </div>
                              <div className="flex-1">
                                <span className="font-crimson font-semibold text-parchment-200 text-sm">{mc.name}</span>
                                <span className="ml-2 text-xs text-parchment-500 capitalize">({mc.gender})</span>
                                <p className="text-xs text-parchment-400 font-crimson mt-0.5">{mc.description}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-900/30 border border-red-500/30 rounded-sm p-3">
                        <p className="text-red-300 text-sm font-crimson">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <OrnateButton
                        type="button"
                        variant="ghost"
                        onClick={() => (isQuick ? router.push("/kid/library") : setStep("interests"))}
                        className="flex-1"
                      >
                        Back
                      </OrnateButton>
                      <OrnateButton
                        variant="primary"
                        size="lg"
                        className="flex-1"
                        onClick={(e) => handleCharacterSubmit(e as unknown as React.FormEvent)}
                        disabled={selectedMediaChars.size === 0}
                      >
                        Create {selectedMediaChars.size} Character{selectedMediaChars.size !== 1 ? "s" : ""}
                      </OrnateButton>
                    </div>
                  </div>
                )}
              </ParchmentCard>
            </motion.div>
          )}

          {step === "creating" && (
            <motion.div key="creating" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <ParchmentCard className="p-12 text-center">
                <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-3">
                  Creating {characterMode === "media" && selectedMediaChars.size > 1 ? "characters" : "your character"}...
                </h2>
                <p className="text-parchment-400 font-crimson mb-6">
                  Our storybook workshop is bringing {characterMode === "media" && selectedMediaChars.size > 1 ? "them" : "your character"} to life!
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
