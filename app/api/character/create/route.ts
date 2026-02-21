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
    const { childName, childAge, childInterests, characterName, characterGender } = body;

    if (!childName || !childAge || !characterName) {
      return NextResponse.json(
        { error: "Missing required fields: childName, childAge, characterName" },
        { status: 400 }
      );
    }

    const characterInfo = await generateCharacterInfo(
      childName,
      childAge,
      characterName,
      childInterests || [],
      characterGender
    );

    let characterImageUrl: string | undefined;
    try {
      let imageUrl = await generateCharacterImage(characterName, characterInfo);
      // Retry once if no image (often fixes first-request/cold-start failure during onboarding)
      if (!imageUrl) {
        console.warn("[character/create] First image attempt failed, retrying once...");
        await new Promise((r) => setTimeout(r, 800));
        imageUrl = await generateCharacterImage(characterName, characterInfo);
      }
      if (imageUrl) {
        characterImageUrl = imageUrl;
        console.log("[character/create] Image generated:", imageUrl);
      } else {
        console.warn("[character/create] No image generated for", characterName, "(check API key and server logs above)");
      }
    } catch (err) {
      console.error("[character/create] Image generation error:", err);
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
