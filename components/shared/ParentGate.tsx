"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrnateButton } from "@/components/ui/StoryBookUI";

interface ParentGateProps {
  isOpen: boolean;
  onPass: () => void;
  onCancel: () => void;
  requirePin?: boolean;
}

export default function ParentGate({ isOpen, onPass, onCancel, requirePin = false }: ParentGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (requirePin) {
      if (pin.length < 4) { setError("Please enter your 4-digit PIN"); return; }
      onPass();
    } else {
      onPass();
    }
    setPin("");
    setError("");
  }

  return (
    <AnimatePresence>
      {isOpen && (
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
              <h2 className="text-xl font-cinzel font-bold text-parchment-200">Parent Check</h2>
              <p className="text-parchment-500 font-crimson text-sm mt-1">
                {requirePin ? "Enter your parent PIN to continue." : "Are you ready to hand the device to your child?"}
              </p>
            </div>

            {requirePin && (
              <div className="mb-4">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                  placeholder="Enter PIN"
                  className="w-full bg-ink-800/80 border-2 border-gold-500/20 rounded-sm px-4 py-3
                             text-center text-2xl tracking-[0.5em] font-cinzel text-parchment-200
                             focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10"
                />
                {error && <p className="text-red-400 text-sm mt-1 font-crimson text-center">{error}</p>}
              </div>
            )}

            <div className="flex gap-3">
              <OrnateButton variant="ghost" onClick={onCancel} className="flex-1">Cancel</OrnateButton>
              <OrnateButton variant="primary" onClick={handleSubmit} className="flex-1">
                {requirePin ? "Unlock" : "Hand to Child"}
              </OrnateButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
