"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { setUser } from "@/lib/db-client";
import { ParchmentCard, OrnateButton, ScrollInput } from "@/components/ui/StoryBookUI";

export default function SettingsPage() {
  const { uid, displayName, children } = useAppStore();
  const [notifPrefs, setNotifPrefs] = useState({ emailWeekly: true, emailMonthly: true, alerts: true });
  const [pin, setPin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!uid) return;
    setSaving(true);
    try {
      await setUser(uid, { notificationPrefs: notifPrefs });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-cinzel font-bold text-parchment-200">Settings</h1>
        <p className="text-parchment-500 font-crimson">Manage your account and preferences.</p>
      </div>

      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Profile</h3>
        <div className="space-y-2">
          <p className="text-sm font-crimson text-parchment-400">Name: <span className="text-parchment-200 font-semibold">{displayName}</span></p>
          <p className="text-sm font-crimson text-parchment-400">Children: {children.map((c) => c.name).join(", ") || "None"}</p>
        </div>
      </ParchmentCard>

      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Notifications</h3>
        <div className="space-y-3">
          {[
            { key: "emailWeekly" as const, label: "Weekly email digest" },
            { key: "emailMonthly" as const, label: "Monthly report" },
            { key: "alerts" as const, label: "Safety alerts" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifPrefs[key]}
                onChange={(e) => setNotifPrefs((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="w-5 h-5 rounded accent-gold-500"
              />
              <span className="text-sm font-crimson text-parchment-300">{label}</span>
            </label>
          ))}
        </div>
      </ParchmentCard>

      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-parchment-200 mb-4">Parent PIN</h3>
        <p className="text-sm text-parchment-500 font-crimson mb-3">Set a PIN to protect access to kid chat mode.</p>
        <div className="flex gap-3 items-center">
          <input
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="4-6 digit PIN"
            className="bg-ink-800/80 border-2 border-gold-500/20 rounded-sm px-4 py-2.5
                       text-center text-lg tracking-[0.3em] font-cinzel w-40 text-parchment-200
                       focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10"
          />
          <OrnateButton variant="ghost" size="sm" disabled={pin.length < 4} onClick={() => setPin("")}>
            Set PIN
          </OrnateButton>
        </div>
      </ParchmentCard>

      <div className="flex gap-3">
        <OrnateButton variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </OrnateButton>
      </div>

      <ParchmentCard>
        <h3 className="text-lg font-cinzel font-semibold text-red-400 mb-2">Danger Zone</h3>
        <p className="text-sm text-parchment-500 font-crimson mb-4">
          Reset the entire local database. This deletes all users, children, characters, messages, and analytics. This cannot be undone.
        </p>
        <OrnateButton
          variant="ghost"
          onClick={async () => {
            if (!confirm("Are you sure? This will erase ALL data and log you out.")) return;
            await fetch("/api/db/reset", { method: "POST" });
            localStorage.clear();
            window.location.href = "/login";
          }}
        >
          <span className="text-red-400">Reset Database</span>
        </OrnateButton>
      </ParchmentCard>
    </div>
  );
}
