"use client";

import { useRef, useCallback, useEffect } from "react";
import type { CharacterGender } from "@/types/domain";

interface VoicePlayerProps {
  onSpeakingChange: (isSpeaking: boolean) => void;
  gender?: CharacterGender;
}

export default function VoicePlayer({ onSpeakingChange, gender }: VoicePlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("play", () => onSpeakingChange(true));
    audio.addEventListener("ended", () => onSpeakingChange(false));
    audio.addEventListener("pause", () => onSpeakingChange(false));
    audio.addEventListener("error", () => onSpeakingChange(false));

    return () => {
      audio.pause();
      audio.removeEventListener("play", () => onSpeakingChange(true));
      audio.removeEventListener("ended", () => onSpeakingChange(false));
      audio.removeEventListener("pause", () => onSpeakingChange(false));
      audio.removeEventListener("error", () => onSpeakingChange(false));
    };
  }, [onSpeakingChange]);

  const playTTS = useCallback(async (text: string, voiceGender?: CharacterGender) => {
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, gender: voiceGender || gender || "female" }),
      });

      if (!res.ok) throw new Error("TTS request failed");

      const audioBlob = await res.blob();
      const url = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch (err) {
      console.error("TTS playback error:", err);
      onSpeakingChange(false);
    }
  }, [onSpeakingChange, gender]);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__lumioPlayTTS = playTTS;
    return () => {
      delete (window as unknown as Record<string, unknown>).__lumioPlayTTS;
    };
  }, [playTTS]);

  return null;
}

export function triggerTTS(text: string, gender?: CharacterGender) {
  const fn = (window as unknown as Record<string, unknown>).__lumioPlayTTS;
  if (typeof fn === "function") {
    (fn as (text: string, gender?: CharacterGender) => void)(text, gender);
  }
}
