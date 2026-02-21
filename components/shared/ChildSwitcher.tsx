"use client";

import { useAppStore } from "@/store/useAppStore";

export default function ChildSwitcher() {
  const { children, activeChildId, setActiveChild } = useAppStore();

  if (children.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-parchment-500 font-crimson">Child:</span>
      <select
        value={activeChildId ?? ""}
        onChange={(e) => setActiveChild(e.target.value)}
        className="bg-ink-800 border border-gold-500/20 rounded-sm px-3 py-1.5 text-sm
                   font-crimson text-parchment-200 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name === "Friend" && child.characterName ? child.characterName : child.name}
          </option>
        ))}
      </select>
    </div>
  );
}
