"use client";

import { useState } from "react";
import { localSignIn } from "@/lib/auth-client";
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await localSignIn(email, password);
      router.push("/kid/library");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
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
            Enter the Library
          </h2>
          <p className="text-center text-parchment-500 font-crimson mb-6">
            The characters await your return
          </p>

          <InkDivider className="mb-6" />

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-sm p-3 mb-4">
              <p className="text-red-300 text-sm font-crimson">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
              required
            />

            <OrnateButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full mt-2"
            >
              Unlock the Door
            </OrnateButton>
          </form>

          <InkDivider className="mt-6 mb-4" />

          <p className="text-center text-sm text-parchment-500 font-crimson">
            New to Lumio?{" "}
            <Link href="/signup" className="text-gold-400 hover:text-gold-300 font-semibold transition-colors">
              Begin Your Journey
            </Link>
          </p>
        </ParchmentCard>
      </motion.div>
    </div>
  );
}
