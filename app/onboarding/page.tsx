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
import type { CreateCharacterResponse, AnalyzeMediaResponse } from "@/types/api";
import type { CommunicationLevel, PersonalityType, CharacterGender } from "@/types/domain";

type Step = "parent" | "child" | "interests" | "character" | "creating";
type CharacterMode = "custom" | "media";

const PERSONALITY_OPTIONS: { value: PersonalityType; label: string; emoji: string }[] = [
  { value: "shy", label: "Shy", emoji: "🤫" },
  { value: "outgoing", label: "Outgoing", emoji: "🗣️" },
  { value: "curious", label: "Curious", emoji: "🔍" },
  { value: "creative", label: "Creative", emoji: "🎨" },
  { value: "calm", label: "Calm", emoji: "🧘" },
];

const COMM_LEVELS: { value: CommunicationLevel; label: string; desc: string }[] = [
  { value: "early", label: "Just learning to talk", desc: "Ages 2-4, simple words and phrases" },
  { value: "developing", label: "Can hold a conversation", desc: "Ages 4-8, full sentences" },
  { value: "fluent", label: "Reads and writes well", desc: "Ages 8-12, complex thoughts" },
];

const SENSITIVITY_OPTIONS = [
  "Divorce", "Death", "Violence", "Scary things", "Loneliness",
  "Bullying", "Moving away", "Hospital", "Darkness",
];

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

  // Stage 1: Parent profile
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Stage 2: Child profile
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [communicationLevel, setCommunicationLevel] = useState<CommunicationLevel>("developing");
  const [personalityType, setPersonalityType] = useState<PersonalityType>("curious");
  const [sensitivities, setSensitivities] = useState<string[]>([]);
  const [favoriteColor, setFavoriteColor] = useState("");

  // Stage 3: Interests
  const [interests, setInterests] = useState<string[]>([]);

  // Stage 4: Character creation
  const [characterMode, setCharacterMode] = useState<CharacterMode>("custom");
  const [characterName, setCharacterName] = useState("");
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaType, setMediaType] = useState<"cartoon" | "movie" | "book" | "game">("cartoon");
  const [mediaCharacters, setMediaCharacters] = useState<AnalyzeMediaResponse["characters"]>([]);
  const [selectedMediaChars, setSelectedMediaChars] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleParentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid) return;
    await setUser(uid, {
      email: email || "",
      displayName,
      phone: phone || undefined,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactPhone: emergencyContactPhone || undefined,
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

  async function createSingleCharacter(name: string, gender?: CharacterGender) {
    const res = await fetch("/api/character/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childName,
        childAge,
        childInterests: interests,
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

    try {
      const childBase = {
        parentId: uid,
        name: childName,
        age: childAge,
        interests,
        language: undefined,
        communicationLevel,
        personalityType,
        sensitivities,
        favoriteColor: favoriteColor || undefined,
      };

      if (characterMode === "custom") {
        const data = await createSingleCharacter(characterName);
        await createChild({
          ...childBase,
          characterName,
          characterInfo: data.characterInfo,
          characterImageUrl: data.characterImageUrl,
        });
      } else {
        const selected = Array.from(selectedMediaChars);
        for (const idx of selected) {
          const mc = mediaCharacters[idx];
          const data = await createSingleCharacter(mc.name, mc.gender);
          await createChild({
            ...childBase,
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
          {/* STAGE 1: Parent Profile */}
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
                  <ScrollInput
                    label="Phone Number"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Your phone number (optional)"
                  />

                  <InkDivider className="my-2" />

                  <p className="text-xs text-parchment-500 font-crimson">
                    Emergency contact (in case we ever need to reach someone)
                  </p>
                  <ScrollInput
                    label="Emergency Contact Name"
                    type="text"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    placeholder="Name of a trusted person"
                  />
                  <ScrollInput
                    label="Emergency Contact Phone"
                    type="tel"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    placeholder="Their phone number"
                  />

                  <OrnateButton type="submit" variant="primary" size="lg" className="w-full">
                    Continue
                  </OrnateButton>
                </form>
              </ParchmentCard>
            </motion.div>
          )}

          {/* STAGE 2: Child Profile */}
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

                  <InkDivider className="my-1" />

                  {/* Communication level */}
                  <div className="space-y-2">
                    <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">
                      Communication Level
                    </label>
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

                  {/* Personality type */}
                  <div className="space-y-2">
                    <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">
                      Personality
                    </label>
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

                  {/* Sensitivities */}
                  <div className="space-y-2">
                    <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">
                      Topics to Avoid
                    </label>
                    <p className="text-xs text-parchment-500 font-crimson -mt-1">
                      Select any sensitive topics the character should steer clear of
                    </p>
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

                  {/* Favorite color */}
                  <ScrollInput
                    label="Favorite Color (optional)"
                    type="text"
                    value={favoriteColor}
                    onChange={(e) => setFavoriteColor(e.target.value)}
                    placeholder="e.g., Blue, Purple, Rainbow"
                  />

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

          {/* STAGE 3: Interests */}
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

          {/* STAGE 4: Character Creation */}
          {step === "character" && (
            <motion.div
              key="character"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ParchmentCard className="p-8">
                <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-4">
                  Create a Character
                </h2>

                {/* Mode tabs */}
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
                        <p className="text-sm font-cinzel text-parchment-300">
                          Select characters to create:
                        </p>
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
                                <span className="font-crimson font-semibold text-parchment-200 text-sm">
                                  {mc.name}
                                </span>
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
                        onClick={() => setStep("interests")}
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
            <motion.div
              key="creating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <ParchmentCard className="p-12 text-center">
                <h2 className="text-xl font-cinzel font-semibold text-parchment-200 mb-3">
                  Creating your character{characterMode === "media" && selectedMediaChars.size > 1 ? "s" : ""}...
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
