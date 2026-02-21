import { NextRequest, NextResponse } from "next/server";
import { analyzeMediaCharacters } from "@/lib/providers/gemini";
import type { AnalyzeMediaRequest, AnalyzeMediaResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeMediaRequest = await req.json();
    const { mediaTitle, mediaType } = body;

    if (!mediaTitle || !mediaType) {
      return NextResponse.json(
        { error: "Missing required fields: mediaTitle, mediaType" },
        { status: 400 }
      );
    }

    const characters = await analyzeMediaCharacters(mediaTitle, mediaType);

    const response: AnalyzeMediaResponse = {
      title: mediaTitle,
      characters,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Media analysis error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze media" },
      { status: 500 }
    );
  }
}
