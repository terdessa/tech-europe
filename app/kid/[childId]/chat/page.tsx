"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getChild, getRecentMessages } from "@/lib/db-client";
import { useAppStore } from "@/store/useAppStore";
import { getAgeRule } from "@/constants/ageRules";
import { getInitials } from "@/lib/utils";
import { OrnateButton, QuillLoading, AudioWaveform, MagicalMicButton } from "@/components/ui/StoryBookUI";
import VoicePlayer, { triggerTTS } from "@/components/kid/VoicePlayer";
import type { Child, Message } from "@/types/domain";
import type { ChatResponse } from "@/types/api";

export default function KidChatPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params.childId as string;
  const { uid } = useAppStore();

  const [child, setChild] = useState<Child | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [micError, setMicError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (childId && uid) {
      getChild(childId).then((c) => {
        if (c && c.parentId === uid) setChild(c);
      });
      getRecentMessages(childId, 50).then(setMessages);
    }
  }, [childId, uid]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!child || isLoading || !text.trim()) return;

      const kidMsg: Message = {
        role: "kid",
        content: text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, kidMsg]);
      setIsLoading(true);
      setInputText("");

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childId, message: text }),
        });

        if (!res.ok) throw new Error("Chat request failed");

        const data: ChatResponse = await res.json();
        const assistantMsg: Message = {
          role: "assistant",
          content: data.assistantMessage.content,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        triggerTTS(data.assistantMessage.content, child.characterInfo.gender);
      } catch {
        const errorMsg: Message = {
          role: "assistant",
          content: "Oops! Something went wrong. Let's try again!",
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [child, childId, isLoading]
  );

  const handleAudio = useCallback(
    async (blob: Blob) => {
      if (isLoading) return;
      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append("audio", blob);
        const sttRes = await fetch("/api/voice/stt", { method: "POST", body: formData });
        if (!sttRes.ok) throw new Error("STT failed");
        const { transcript } = await sttRes.json();
        if (transcript) {
          setIsLoading(false);
          sendMessage(transcript);
        }
      } catch {
        setIsLoading(false);
      }
    },
    [isLoading, sendMessage]
  );

  const startRecording = useCallback(async () => {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          handleAudio(blob);
        }
        setIsListening(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsListening(true);

      stopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, 15000);
    } catch {
      setMicError("Microphone access denied. Please enable it in your browser settings.");
      setIsListening(false);
    }
  }, [handleAudio]);

  const stopRecording = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleMic = useCallback(() => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isListening, startRecording, stopRecording]);

  if (!child) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <QuillLoading text="Summoning character..." />
      </div>
    );
  }

  const ageRule = getAgeRule(child.age);

  return (
    <div className="flex flex-col h-screen">
      <VoicePlayer onSpeakingChange={setIsSpeaking} gender={child.characterInfo.gender} />

      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-gold-500/10 bg-ink-900/80 backdrop-blur-sm">
        <button
          onClick={() => router.push(`/kid/${childId}/home`)}
          className="text-parchment-400 hover:text-gold-400 transition-colors font-cinzel text-sm"
        >
          ←
        </button>
        <div className="w-10 h-10 rounded-full border border-gold-500/30 bg-ink-700/60 flex items-center justify-center overflow-hidden">
          {child.characterImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={child.characterImageUrl} alt={child.characterName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-cinzel font-bold text-gold-400">
              {getInitials(child.characterName)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h2 className="font-quattro font-bold text-parchment-200 text-sm">{child.characterName}</h2>
          {isSpeaking && <AudioWaveform isActive className="h-4" />}
        </div>
        <OrnateButton size="sm" variant="ghost" onClick={() => router.push("/kid/library")}>
          Library
        </OrnateButton>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4 pt-4">
        {messages.length === 0 && !isLoading && (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-parchment-500 font-crimson text-lg">
              Say hi to {child.characterName}!
            </p>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            className={`flex mb-3 ${msg.role === "kid" ? "justify-end" : "justify-start"}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                msg.role === "kid"
                  ? "bg-gold-500/20 text-parchment-200 border border-gold-500/20 rounded-br-sm"
                  : "bg-ink-800/80 text-parchment-300 border border-ink-600/50 rounded-bl-sm"
              }`}
            >
              {msg.role === "assistant" && (
                <p className="text-xs font-cinzel text-gold-500 mb-1">{child.characterName}</p>
              )}
              <p className="font-crimson text-sm leading-relaxed">{msg.content}</p>
            </div>
          </motion.div>
        ))}

        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="bg-ink-800/80 border border-ink-600/50 rounded-lg rounded-bl-sm px-4 py-3">
              <motion.div
                className="flex gap-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-gold-400" />
                ))}
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-gold-500/10 bg-ink-900/80 backdrop-blur-sm px-4 py-3">
        {micError && (
          <p className="text-red-400 text-xs font-crimson mb-2">{micError}</p>
        )}
        <div className="flex items-center gap-3">
          {ageRule.composerMode === "voice-only" || ageRule.composerMode === "voice-and-text" ? (
            <MagicalMicButton
              isListening={isListening}
              onClick={toggleMic}
              disabled={isLoading}
            />
          ) : null}
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(inputText);
                }
              }}
              placeholder={`Talk to ${child.characterName}...`}
              maxLength={ageRule.maxMessageLength}
              disabled={isLoading}
              className="flex-1 bg-ink-800/80 border border-gold-500/20 rounded-sm px-4 py-2.5 font-crimson text-parchment-200 placeholder:text-ink-400 focus:outline-none focus:border-gold-500/50 transition-all text-sm"
            />
            <OrnateButton
              size="sm"
              variant="primary"
              onClick={() => sendMessage(inputText)}
              disabled={isLoading || !inputText.trim()}
            >
              Send
            </OrnateButton>
          </div>
        </div>
      </div>
    </div>
  );
}
