"use client";

import { useState } from "react";
import { localSignUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  OrnateButton,
  ScrollInput,
  ParchmentCard,
  InkDivider,
  FloatingParticles,
} from "@/components/ui/StoryBookUI";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await localSignUp(email, password, displayName);
      router.push("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="storybook-page flex items-center justify-center min-h-screen p-4 relative">
      <FloatingParticles count={12} />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center mb-8">
          <motion.h1
            className="text-5xl font-cinzel font-bold gold-shimmer mb-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            LUMIO
          </motion.h1>
        </div>

        <ParchmentCard className="p-8">
          <h2 className="text-2xl font-cinzel font-bold text-parchment-200 text-center mb-1">
            Begin Your Journey
          </h2>
          <p className="text-center text-parchment-500 font-crimson mb-6">
            Create your reader&apos;s passport
          </p>

          <InkDivider className="mb-6" />

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-sm p-3 mb-4">
              <p className="text-red-300 text-sm font-crimson">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <ScrollInput
              label="Your Name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              required
            />

            <ScrollInput
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <ScrollInput
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />

            <OrnateButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Open the First Page
            </OrnateButton>
          </form>

          <InkDivider className="mt-6 mb-4" />

          <p className="text-center text-sm text-parchment-500 font-crimson">
            Already have an account?{" "}
            <Link href="/login" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
              Enter the Library
            </Link>
          </p>
        </ParchmentCard>
      </motion.div>
    </div>
  );
}
