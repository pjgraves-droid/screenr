import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First find the assessment without the aiScores relation
    const assessment = await prisma.assessment.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Then try to fetch AI scores separately (handles missing table gracefully)
    let scores: { competencyRank: number; score: number; rationale: string }[] = [];
    try {
      const aiScores = await prisma.aiScore.findMany({
        where: { assessmentId: assessment.id },
      });
      scores = aiScores.map((s) => ({
        competencyRank: s.competencyRank,
        score: s.score,
        rationale: s.rationale,
      }));
    } catch {
      // AiScore table may not exist yet — return empty scores
      console.error("Failed to query AiScore table — it may not exist in the database yet");
    }

    return NextResponse.json({
      assessmentId: assessment.id,
      scores,
    });
  } catch (error) {
    console.error("AI scores endpoint error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
