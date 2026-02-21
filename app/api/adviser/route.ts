import { NextRequest, NextResponse } from "next/server";
import { dbGetChild, dbGetRecentMessages } from "@/lib/local-db";
import { askAdviser } from "@/lib/providers/dust";
import { callGemini } from "@/lib/providers/gemini";

export async function POST(req: NextRequest) {
  try {
    const { childId, question } = await req.json();

    if (!childId || !question) {
      return NextResponse.json(
        { error: "Missing required fields: childId, question" },
        { status: 400 }
      );
    }

    const child = dbGetChild(childId);
    if (!child) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    const recentMessages = dbGetRecentMessages(childId, 50);

    // Try Dust Conversations API first
    try {
      const result = await askAdviser({
        question,
        childProfile: {
          name: child.name as string,
          age: child.age as number,
          characterName: child.characterName as string,
        },
        last30DaysSummaries: [],
        last50Messages: recentMessages.map((m) => ({
          ...m,
          role: (m.role as string) === "kid" || (m.role as string) === "assistant"
            ? (m.role as "kid" | "assistant")
            : "kid" as const,
          content: (m.content as string) ?? "",
          createdAt: (m.createdAt as string) ?? new Date().toISOString(),
        })) as import("@/types/api").MessageDTO[],
      });

      if (result?.answer) {
        return NextResponse.json(result);
      }
      console.warn("[adviser] Dust returned no answer, falling back to Gemini");
    } catch (e) {
      console.warn("[adviser] Dust failed, falling back to Gemini:", e);
    }

    // Gemini fallback
    const chatHistory = recentMessages
      .slice(-20)
      .map((m) => `[${m.role}]: ${m.content}`)
      .join("\n");

    const prompt = `You are a supportive parenting adviser. A parent is asking about their child.

Child profile:
- Name: ${child.name}
- Age: ${child.age}
- Character: ${child.characterName}
- Interests: ${(child.interests as string[] || []).join(", ") || "not specified"}

Recent chat history between child and AI character:
${chatHistory || "No conversations yet."}

Parent's question: "${question}"

Respond as a JSON object with these fields:
- "answer": your detailed, empathetic advice (2-4 paragraphs)
- "suggestedActions": array of 2-3 concrete action items
- "suggestedScripts": array of 1-2 example phrases the parent could use

Respond ONLY with valid JSON.`;

    const raw = await callGemini(prompt);
    const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      return NextResponse.json({
        answer: parsed.answer || "I'm here to help. Could you rephrase your question?",
        suggestedActions: parsed.suggestedActions || [],
        suggestedScripts: parsed.suggestedScripts || [],
      });
    } catch {
      return NextResponse.json({
        answer: raw,
        suggestedActions: [],
        suggestedScripts: [],
      });
    }
  } catch (error) {
    console.error("Adviser error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Adviser failed" },
      { status: 500 }
    );
  }
}
