"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const PRESET_INTERESTS = [
  { label: "Animals", emoji: "🐾" },
  { label: "Dinosaurs", emoji: "🦕" },
  { label: "Space", emoji: "🚀" },
  { label: "Sports", emoji: "⚽" },
  { label: "Art & Drawing", emoji: "🎨" },
  { label: "Music", emoji: "🎵" },
  { label: "Reading", emoji: "📚" },
  { label: "Video Games", emoji: "🎮" },
  { label: "Science", emoji: "🔬" },
  { label: "Nature", emoji: "🌿" },
  { label: "Cooking", emoji: "🍳" },
  { label: "Building & Legos", emoji: "🧱" },
  { label: "Superheroes", emoji: "🦸" },
  { label: "Princesses & Fairy Tales", emoji: "👑" },
  { label: "Cars & Trucks", emoji: "🚗" },
  { label: "Ocean & Sea Life", emoji: "🐠" },
  { label: "Robots & Tech", emoji: "🤖" },
  { label: "Dancing", emoji: "💃" },
  { label: "Puzzles", emoji: "🧩" },
  { label: "Exploring & Adventures", emoji: "🗺️" },
];

interface InterestPickerProps {
  selected: string[];
  onChange: (interests: string[]) => void;
  maxSelections?: number;
}

export default function InterestPicker({
  selected,
  onChange,
  maxSelections = 8,
}: InterestPickerProps) {
  const [customInput, setCustomInput] = useState("");

  function toggleInterest(interest: string) {
    if (selected.includes(interest)) {
      onChange(selected.filter((i) => i !== interest));
    } else if (selected.length < maxSelections) {
      onChange([...selected, interest]);
    }
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed) && selected.length < maxSelections) {
      onChange([...selected, trimmed]);
      setCustomInput("");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">
          Interests & Hobbies
        </label>
        <span className="text-xs text-parchment-600 font-crimson">
          {selected.length}/{maxSelections} selected
        </span>
      </div>

      <p className="text-xs text-parchment-500 font-crimson">
        Pick what your child loves — this helps us shape their character&apos;s personality and conversations.
      </p>

      <div className="flex flex-wrap gap-2">
        {PRESET_INTERESTS.map(({ label, emoji }) => {
          const isSelected = selected.includes(label);
          return (
            <motion.button
              key={label}
              type="button"
              onClick={() => toggleInterest(label)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-crimson border transition-all duration-200",
                isSelected
                  ? "bg-gold-500/20 text-gold-300 border-gold-500/40 shadow-[0_0_8px_rgba(212,175,55,0.15)]"
                  : "bg-ink-800/60 text-parchment-400 border-ink-600/30 hover:border-parchment-500/30 hover:text-parchment-300"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <span className="mr-1">{emoji}</span>
              {label}
            </motion.button>
          );
        })}
      </div>

      {/* Custom interest input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          placeholder="Add something else..."
          className="flex-1 px-3 py-2 bg-ink-800/80 border border-gold-500/20 rounded-sm font-crimson text-sm text-parchment-200 placeholder:text-ink-400 focus:outline-none focus:border-gold-500/50 transition-all"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim() || selected.length >= maxSelections}
          className="px-3 py-2 bg-gold-500/10 border border-gold-500/20 rounded-sm text-gold-400 text-sm font-cinzel hover:bg-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Add
        </button>
      </div>

      {/* Show custom selections that aren't from presets */}
      {selected.filter((s) => !PRESET_INTERESTS.some((p) => p.label === s)).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected
            .filter((s) => !PRESET_INTERESTS.some((p) => p.label === s))
            .map((custom) => (
              <span
                key={custom}
                className="px-3 py-1.5 rounded-full text-sm font-crimson bg-gold-500/20 text-gold-300 border border-gold-500/40 flex items-center gap-1.5"
              >
                ✨ {custom}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((i) => i !== custom))}
                  className="text-gold-400/60 hover:text-red-400 transition-colors ml-1"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
