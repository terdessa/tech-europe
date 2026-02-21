import type { CharacterInfo } from "@/types/domain";

export async function generateCharacterImage(
  characterName: string,
  characterInfo: CharacterInfo
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_IMAGE_API_KEY;
  if (!apiKey) return null;

  const prompt = `A cute, friendly children's storybook illustration of a character called "${characterName}". 
${characterInfo.safeDepictionNote || "A warm, approachable character in a picture book style."}
Style: soft watercolor, rounded shapes, warm colors, safe for children. 
Do NOT depict any copyrighted or trademarked characters.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate a description for this character image: ${prompt}` }] }],
        }),
      }
    );

    if (!res.ok) return null;

    // Placeholder: return a generated avatar URL or null
    // In production, this would call an image generation API
    return null;
  } catch {
    return null;
  }
}
