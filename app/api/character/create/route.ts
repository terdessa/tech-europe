import { NextRequest, NextResponse } from "next/server";
import { generateCharacterInfo } from "@/lib/providers/gemini";
import { generateCharacterImage } from "@/lib/providers/characterImage";
import type {
  CreateCharacterRequest,
  CreateCharacterResponse,
} from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body: CreateCharacterRequest = await req.json();
    const { childName, childAge, characterName } = body;

    if (!childName || !childAge || !characterName) {
      return NextResponse.json(
        { error: "Missing required fields: childName, childAge, characterName" },
        { status: 400 }
      );
    }

    const characterInfo = await generateCharacterInfo(
      childName,
      childAge,
      characterName
    );

    let characterImageUrl: string | undefined;
    try {
      const imageUrl = await generateCharacterImage(characterName, characterInfo);
      if (imageUrl) characterImageUrl = imageUrl;
    } catch {
      // Image generation is optional; continue without it
    }

    const response: CreateCharacterResponse = {
      characterInfo,
      characterImageUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Character creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create character" },
      { status: 500 }
    );
  }
}
