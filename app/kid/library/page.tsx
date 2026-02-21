"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { getChildrenForParent } from "@/lib/db-client";
import { getInitials } from "@/lib/utils";
import {
  OrnateButton,
  ParchmentCard,
  IllustratedHeader,
  InkDivider,
  QuillLoading,
  FloatingParticles,
} from "@/components/ui/StoryBookUI";
import type { Child } from "@/types/domain";

export default function KidLibraryPage() {
  const router = useRouter();
  const { uid, children: storeChildren, setChildren } = useAppStore();
  const [loading, setLoading] = useState(true);

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
            onClick={() => router.push("/parent/dashboard")}
            className="font-cinzel text-sm text-parchment-500 hover:text-parchment-300 transition-colors"
          >
            Parent
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-12">
        <IllustratedHeader title="Your Characters" subtitle="Choose a friend to talk to!" />

        {/* Add character button */}
        <div className="flex justify-center mb-8">
          <OrnateButton
            variant="primary"
            onClick={() => router.push("/kid/add-character")}
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
            <OrnateButton variant="primary" onClick={() => router.push("/kid/add-character")}>
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
                    onClick={() => router.push(`/kid/${child.id}/home`)}
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
                    <p className="text-sm text-parchment-500 font-crimson text-center mt-1">
                      {child.name}&apos;s friend &middot; Age {child.age}
                    </p>

                    {/* Interests */}
                    {child.interests?.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                        {child.interests.slice(0, 4).map((interest) => (
                          <span
                            key={interest}
                            className="text-xs px-2 py-0.5 rounded-full bg-forest-900/30 text-forest-300 border border-forest-600/20 font-crimson"
                          >
                            {interest}
                          </span>
                        ))}
                        {child.interests.length > 4 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-ink-700/50 text-parchment-500 font-crimson">
                            +{child.interests.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Traits */}
                    {child.characterInfo?.keyTraits && (
                      <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                        {child.characterInfo.keyTraits.slice(0, 3).map((trait) => (
                          <span
                            key={trait}
                            className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 font-crimson"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                      <OrnateButton
                        size="sm"
                        variant="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/kid/${child.id}/home`);
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
