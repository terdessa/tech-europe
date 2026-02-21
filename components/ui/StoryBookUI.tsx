"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

// ── Ornate Button ──────────────────────────────────────────────
interface OrnateButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "wax";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function OrnateButton({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  disabled,
  ...props
}: OrnateButtonProps) {
  const baseStyles =
    "relative font-cinzel font-bold tracking-wider uppercase transition-all duration-300 rounded-sm border-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-to-b from-gold-400 to-gold-600 text-ink-900 border-gold-700 hover:from-gold-300 hover:to-gold-500 shadow-lg hover:shadow-gold-500/30",
    secondary:
      "bg-parchment-100 text-ink-800 border-ink-300 hover:bg-parchment-200 hover:border-ink-400 shadow-md",
    ghost:
      "bg-transparent text-parchment-200 border-parchment-400/30 hover:bg-parchment-100/10 hover:border-parchment-300/50",
    wax: "bg-gradient-to-b from-red-700 to-red-900 text-parchment-100 border-red-950 hover:from-red-600 hover:to-red-800 shadow-lg rounded-full",
  };

  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// ── Parchment Card ────────────────────────────────────────────
interface ParchmentCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function ParchmentCard({
  children,
  className,
  hover = false,
  onClick,
}: ParchmentCardProps) {
  const Component = hover ? motion.div : "div";

  return (
    <Component
      className={cn(
        "bg-ink-800/60 backdrop-blur-sm border border-gold-500/20 rounded-sm p-6",
        "shadow-[inset_0_0_30px_rgba(184,134,11,0.03),0_4px_20px_rgba(0,0,0,0.3)]",
        hover && "cursor-pointer hover:border-gold-500/40 hover:bg-ink-800/80 transition-all duration-300",
        className
      )}
      onClick={onClick}
      {...(hover ? { whileHover: { y: -2 } } : {})}
    >
      {children}
    </Component>
  );
}

// ── Ink Divider ───────────────────────────────────────────────
export function InkDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-4 py-4", className)}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
      <svg width="16" height="16" viewBox="0 0 16 16" className="text-gold-500/50">
        <path d="M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6Z" fill="currentColor" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
    </div>
  );
}

// ── Scroll Input ──────────────────────────────────────────────
interface ScrollInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function ScrollInput({ label, error, className, ...props }: ScrollInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full px-4 py-3 bg-ink-800/80 border-2 border-gold-500/20 rounded-sm",
          "font-crimson text-parchment-200 placeholder:text-ink-400",
          "focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10",
          "transition-all duration-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-sm font-crimson">{error}</p>}
    </div>
  );
}

// ── Scroll Textarea ───────────────────────────────────────────
interface ScrollTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function ScrollTextarea({ label, error, className, ...props }: ScrollTextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-cinzel font-medium text-parchment-300 tracking-wide">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full px-4 py-3 bg-ink-800/80 border-2 border-gold-500/20 rounded-sm resize-none",
          "font-crimson text-parchment-200 placeholder:text-ink-400",
          "focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/10",
          "transition-all duration-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-sm font-crimson">{error}</p>}
    </div>
  );
}

// ── Illustrated Header ────────────────────────────────────────
interface IllustratedHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function IllustratedHeader({ title, subtitle, className }: IllustratedHeaderProps) {
  return (
    <div className={cn("text-center py-8", className)}>
      <svg className="mx-auto mb-4 text-gold-500/40" width="120" height="20" viewBox="0 0 120 20">
        <path d="M0 10 Q30 0 60 10 Q90 20 120 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="10" r="3" fill="currentColor" />
      </svg>

      <h1 className="text-3xl md:text-4xl font-cinzel font-bold gold-shimmer">
        {title}
      </h1>

      {subtitle && (
        <p className="mt-3 text-lg font-crimson text-parchment-400">{subtitle}</p>
      )}

      <svg className="mx-auto mt-4 text-gold-500/40" width="120" height="20" viewBox="0 0 120 20">
        <path d="M0 10 Q30 20 60 10 Q90 0 120 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="10" r="3" fill="currentColor" />
      </svg>
    </div>
  );
}

// ── Quill Loading ─────────────────────────────────────────────
export function QuillLoading({
  text = "Inscribing...",
  className,
}: {
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-8", className)}>
      <motion.div
        className="text-4xl"
        animate={{ rotate: [0, 10, -10, 0], y: [0, -4, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        ✒️
      </motion.div>
      <div className="h-0.5 w-32 bg-ink-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-500 to-gold-300"
          animate={{ width: ["0%", "100%", "0%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="font-cinzel text-sm text-parchment-400 tracking-wider">{text}</p>
    </div>
  );
}

// ── Magical Mic Button ────────────────────────────────────────
interface MagicalMicButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function MagicalMicButton({ isListening, onClick, disabled }: MagicalMicButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 disabled:opacity-50"
    >
      {isListening && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-gold-400/50"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-gold-400/30"
            animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      )}

      <div className={cn(
        "relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all",
        isListening
          ? "bg-gradient-to-b from-gold-400 to-gold-600 border-gold-300 animate-glow-pulse"
          : "bg-ink-800/80 border-gold-500/30 hover:border-gold-500/60 hover:bg-ink-700/80"
      )}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
          className={cn("transition-colors", isListening ? "text-ink-900" : "text-gold-400")}>
          <path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" fill="currentColor" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </button>
  );
}

// ── Audio Waveform ────────────────────────────────────────────
export function AudioWaveform({ isActive, className }: { isActive: boolean; className?: string }) {
  const bars = 12;
  return (
    <div className={cn("flex items-center justify-center gap-0.5 h-8", className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-gold-400 rounded-full"
          animate={isActive
            ? { height: [4, 16 + Math.random() * 16, 4] }
            : { height: 4 }
          }
          transition={isActive
            ? { duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.05 }
            : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

// ── Floating Particles ────────────────────────────────────────
export function FloatingParticles({ count = 12 }: { count?: number }) {
  return (
    <div className="particle-field">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-gold-400/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}
