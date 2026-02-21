"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { getChildrenForParent, getUser } from "@/lib/db-client";
import { getInitials } from "@/lib/utils";
import {
  OrnateButton,
  ParchmentCard,
  IllustratedHeader,
  InkDivider,
  QuillLoading,
  FloatingParticles,
} from "@/components/ui/StoryBookUI";
import ParentGate from "@/components/shared/ParentGate";
import type { Child } from "@/types/domain";

export default function KidLibraryPage() {
  const router = useRouter();
  const { uid, children: storeChildren, setChildren } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [setPinModalOpen, setSetPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError, setPinError] = useState("");
  const [pinSaving, setPinSaving] = useState(false);

  const fetchChildren = useCallback(async () => {
    if (!uid) return;
    try {
      const kids = await getChildrenForParent(uid);
      setChildren(kids);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [uid, setChildren]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const handleDeleteChild = async (childId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Remove this character?")) return;
    try {
      await fetch(`/api/db/children/${childId}`, { method: "DELETE" });
      setChildren(storeChildren.filter((c) => c.id !== childId));
    } catch {
      /* ignore */
    }
  };

  const handleParentClick = useCallback(async () => {
    if (!uid) return;
    try {
      const user = await getUser(uid);
      if (!user?.parentPinHash) {
        setSetPinModalOpen(true);
      } else {
        setParentGateOpen(true);
      }
    } catch {
      setSetPinModalOpen(true);
    }
  }, [uid]);

  const handleSetPinSubmit = useCallback(async () => {
    if (!uid) return;
    const trimmed = pin.replace(/\D/g, "");
    const confirmTrimmed = pinConfirm.replace(/\D/g, "");
    if (trimmed.length < 4 || trimmed.length > 6) {
      setPinError("PIN must be 4–6 digits");
      return;
    }
    if (trimmed !== confirmTrimmed) {
      setPinError("PINs do not match");
      return;
    }
    setPinSaving(true);
    setPinError("");
    try {
      const res = await fetch("/api/auth/set-parent-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, pin: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setPinError(data.error || "Failed to set PIN");
        return;
      }
      setSetPinModalOpen(false);
      setPin("");
      setPinConfirm("");
      router.push("/parent/dashboard");
    } catch {
      setPinError("Something went wrong");
    } finally {
      setPinSaving(false);
    }
  }, [uid, pin, pinConfirm, router]);

  const handleVerifyPin = useCallback(
    async (enteredPin: string) => {
      if (!uid) return false;
      const res = await fetch("/api/auth/verify-parent-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, pin: enteredPin }),
      });
      return res.ok;
    },
    [uid]
  );

  return (
    <div className="storybook-page min-h-screen relative">
      <FloatingParticles count={20} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-gold-500/10">
        <h1 className="font-cinzel font-bold text-xl">
          <span className="gold-shimmer">LUMIO</span>
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/kid/library")}
            className="font-cinzel text-sm text-parchment-300 hover:text-gold-400 transition-colors"
          >
            Home
          </button>
          <button
            onClick={handleParentClick}
            className="font-cinzel text-sm text-parchment-500 hover:text-parchment-300 transition-colors"
          >
            Parent
          </button>
        </div>
      </nav>

      <ParentGate
        isOpen={parentGateOpen}
        onPass={() => {
          setParentGateOpen(false);
          router.push("/parent/dashboard");
        }}
        onCancel={() => setParentGateOpen(false)}
        requirePin
        onVerifyPin={handleVerifyPin}
      />

      <AnimatePresence>
        {setPinModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-ink-800/90 border border-gold-500/20 rounded-sm p-8 max-w-sm w-full mx-4 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔐</div>
                <h2 className="text-xl font-cinzel font-bold text-parchment-200">Set parent PIN</h2>
                <p className="text-parchment-500 font-crimson text-sm mt-1">
                  Choose a 4–6 digit PIN to access the parent area.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ""));
                    setPinError("");
                  }}
                  placeholder="PIN"
                  className="w-full bg-ink-800/80 border-2 border-gold-500/20 rounded-sm px-4 py-3
                             text-center text-2xl tracking-[0.5em] font-cinzel text-parchment-200
                             focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10"
                />
                <input
                  type="password"
                  maxLength={6}
                  value={pinConfirm}
                  onChange={(e) => {
                    setPinConfirm(e.target.value.replace(/\D/g, ""));
                    setPinError("");
                  }}
                  placeholder="Confirm PIN"
                  className="w-full bg-ink-800/80 border-2 border-gold-500/20 rounded-sm px-4 py-3
                             text-center text-2xl tracking-[0.5em] font-cinzel text-parchment-200
                             focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10"
                />
                {pinError && (
                  <p className="text-red-400 text-sm font-crimson text-center">{pinError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <OrnateButton
                  variant="ghost"
                  onClick={() => {
                    setSetPinModalOpen(false);
                    setPin("");
                    setPinConfirm("");
                    setPinError("");
                  }}
                  className="flex-1"
                  disabled={pinSaving}
                >
                  Cancel
                </OrnateButton>
                <OrnateButton
                  variant="primary"
                  onClick={handleSetPinSubmit}
                  className="flex-1"
                  disabled={pinSaving || pin.length < 4 || pinConfirm.length < 4}
                >
                  {pinSaving ? "Setting..." : "Set PIN"}
                </OrnateButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-12">
        <IllustratedHeader title="Your Characters" subtitle="Choose a friend to talk to!" />

        {/* Add character button */}
        <div className="flex justify-center mb-8">
          <OrnateButton
            variant="primary"
            onClick={() => router.push("/kid/add-character?quick=1")}
          >
            🎭 Add a New Character
          </OrnateButton>
        </div>

        <InkDivider />

        {loading ? (
          <QuillLoading text="Loading your friends..." />
        ) : storeChildren.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🌟</div>
            <h2 className="text-2xl font-cinzel font-bold text-parchment-300 mb-2">
              No friends yet!
            </h2>
            <p className="text-parchment-500 font-crimson mb-6">
              Add your first story friend to get started!
            </p>
            <OrnateButton variant="primary" onClick={() => router.push("/kid/add-character?quick=1")}>
              Create Your First Character
            </OrnateButton>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            <AnimatePresence>
              {storeChildren.map((child, i) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <ParchmentCard
                    hover
                    onClick={() => router.push(`/kid/${child.id}/chat`)}
                    className="relative group"
                  >
                    {/* Avatar */}
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full border-2 border-gold-500/30 bg-ink-700/60 flex items-center justify-center overflow-hidden">
                        {child.characterImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={child.characterImageUrl}
                            alt={child.characterName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-cinzel font-bold text-gold-400">
                            {getInitials(child.characterName)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Character info */}
                    <h3 className="text-lg font-quattro font-bold text-parchment-200 text-center">
                      {child.characterName}
                    </h3>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <OrnateButton
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/kid/${child.id}/chat`);
                        }}
                      >
                        Talk to me!
                      </OrnateButton>
                      <button
                        onClick={(e) => handleDeleteChild(child.id!, e)}
                        className="text-ink-400 hover:text-red-400 transition-colors text-sm px-2 py-1"
                      >
                        ✕
                      </button>
                    </div>
                  </ParchmentCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
