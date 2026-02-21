import { NextRequest, NextResponse } from "next/server";
import { speechToText } from "@/lib/providers/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Missing audio file" },
        { status: 400 }
      );
    }

    const audioBuffer = await audioFile.arrayBuffer();

    if (audioBuffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Audio file too large (max 10MB)" },
        { status: 400 }
      );
    }

    const transcript = await speechToText(audioBuffer);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "STT failed" },
      { status: 500 }
    );
  }
}
