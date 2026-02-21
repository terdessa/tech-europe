import { NextRequest, NextResponse } from "next/server";
import { sendMissionNotification } from "@/lib/providers/codewords";
import { suggestMissions } from "@/lib/providers/dust";
import {
  dbGetChild,
  dbGetRecentAnalytics,
  dbGetActiveMissions,
} from "@/lib/local-db";
import type { Child } from "@/types/domain";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Handle mission suggestions
    if (body.type === "suggest" && body.childId) {
      const childDoc = dbGetChild(body.childId);
      if (!childDoc) {
        return NextResponse.json({ error: "Child not found" }, { status: 404 });
      }
      const child = childDoc as unknown as Child;

      const analytics = dbGetRecentAnalytics(body.childId, 7);
      const recentMoods = analytics.map(
        (a) => (a.data.dominantMood as string) || "neutral"
      );
      const recentTopics = analytics.flatMap(
        (a) => (a.data.topTopics as string[]) || []
      );

      const activeMissions = dbGetActiveMissions(body.childId);
      const currentMissions = activeMissions.map((m) => ({
        title: m.title as string,
        description: m.description as string,
      }));

      const result = await suggestMissions({
        childProfile: {
          name: child.name,
          age: child.age,
          characterName: child.characterName,
        },
        recentTopics: Array.from(new Set(recentTopics)).slice(0, 10),
        recentMoods,
        currentMissions,
      });

      return NextResponse.json(result);
    }

    // Handle mission creation notification
    const { childName, missionTitle, missionDescription, source } = body;

    if (!childName || !missionTitle) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await sendMissionNotification({
      childName,
      missionTitle,
      missionDescription: missionDescription || "",
      source: source || "parent",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("CodeWords mission error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mission operation failed" },
      { status: 500 }
    );
  }
}
