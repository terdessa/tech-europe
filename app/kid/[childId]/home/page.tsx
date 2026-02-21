"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getChild } from "@/lib/db-client";
import { useAppStore } from "@/store/useAppStore";
import { getInitials } from "@/lib/utils";
import { OrnateButton, InkDivider } from "@/components/ui/StoryBookUI";
import type { Child } from "@/types/domain";

export default function KidHomePage() {
  const router = useRouter();
  const params = useParams();
  const childId = params.childId as string;
  const { uid } = useAppStore();
  const [child, setChild] = useState<Child | null>(null);

  useEffect(() => {
    if (childId) {
      getChild(childId).then((c) => {
        if (c && c.parentId === uid) setChild(c);
      });
    }
  }, [childId, uid]);

  if (!child) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        className="text-center space-y-6 max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Character avatar */}
        <div className="flex justify-center">
          <motion.div
            className="w-40 h-40 rounded-full border-2 border-gold-500/30 bg-ink-700/60 flex items-center justify-center overflow-hidden animate-breathe"
            style={{ boxShadow: "0 0 40px rgba(212,175,55,0.15)" }}
          >
            {child.characterImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={child.characterImageUrl}
                alt={child.characterName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-cinzel font-bold text-gold-400">
                {getInitials(child.characterName)}
              </span>
            )}
          </motion.div>
        </div>

        <div>
          <h1 className="text-4xl font-quattro font-bold gold-shimmer mb-2">
            {child.characterName}
          </h1>
          <p className="text-parchment-400 font-crimson text-lg">
            {child.characterInfo.backstorySummary ||
              `Hi ${child.name}! I'm ready to chat!`}
          </p>
        </div>

        <InkDivider />

        <div className="flex flex-col items-center gap-3">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <OrnateButton
              variant="primary"
              size="lg"
              onClick={() => router.push(`/kid/${childId}/chat`)}
              className="text-xl px-12 py-5"
            >
              🗣️ Talk!
            </OrnateButton>
          </motion.div>

          <OrnateButton
            variant="ghost"
            size="sm"
            onClick={() => router.push("/kid/library")}
          >
            ← My Characters
          </OrnateButton>
        </div>

        {/* Traits */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {child.characterInfo.keyTraits.map((trait, i) => (
            <motion.span
              key={trait}
              className="bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 text-sm font-crimson text-gold-400"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              {trait}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
