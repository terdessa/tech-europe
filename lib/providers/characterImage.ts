import type { CharacterInfo } from "@/types/domain";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const NANO_BANANA_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

export async function generateCharacterImage(
  characterName: string,
  characterInfo: CharacterInfo
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_IMAGE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = `Generate a cute, friendly children's storybook illustration of a character called "${characterName}". 
${characterInfo.safeDepictionNote || "A warm, approachable character in a picture book style."}
Style: soft watercolor, rounded shapes, warm colors, child-safe illustration. 
Must be a single character portrait on a simple background.
Do NOT depict any copyrighted or trademarked characters.`;

  try {
    const res = await fetch(
      `${NANO_BANANA_URL}?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!res.ok) {
      console.error("Image generation API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) return null;

    for (const part of parts) {
      if (part.inline_data?.mime_type?.startsWith("image/")) {
        const base64 = part.inline_data.data;
        const ext = part.inline_data.mime_type === "image/png" ? "png" : "webp";
        const filename = `${characterName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}.${ext}`;

        const dir = join(process.cwd(), "public", "characters");
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

        writeFileSync(join(dir, filename), Buffer.from(base64, "base64"));
        return `/characters/${filename}`;
      }
    }

    return null;
  } catch (err) {
    console.error("Character image generation failed:", err);
    return null;
  }
}
