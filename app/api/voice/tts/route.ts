import { NextRequest, NextResponse } from "next/server";
import { textToSpeech } from "@/lib/providers/elevenlabs";
import type { CharacterGender } from "@/types/domain";

export async function POST(req: NextRequest) {
  try {
    const { text, gender } = await req.json() as { text: string; gender?: CharacterGender };

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid text field" },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Text too long (max 2000 chars)" },
        { status: 400 }
      );
    }

    const audioBuffer = await textToSpeech(text, gender || "female");

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS failed" },
      { status: 500 }
    );
  }
}
