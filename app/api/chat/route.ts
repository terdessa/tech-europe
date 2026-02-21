import { NextRequest, NextResponse } from "next/server";
import { runChatPipeline } from "@/lib/pipelines/chatPipeline";
import type { ChatRequest, ChatResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { childId, message } = body;

    if (!childId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: childId, message" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message too long" },
        { status: 400 }
      );
    }

    const result = await runChatPipeline(childId, message);

    const response: ChatResponse = {
      assistantMessage: result.assistantMessage,
      flags: result.flags,
      dustA: result.dustA,
      dustB: result.dustB,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat pipeline error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Chat pipeline failed",
      },
      { status: 500 }
    );
  }
}
