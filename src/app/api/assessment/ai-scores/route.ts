import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: { userId: session.user.id },
    include: { aiScores: true },
    orderBy: { createdAt: "desc" },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  return NextResponse.json({
    assessmentId: assessment.id,
    scores: assessment.aiScores.map((s) => ({
      competencyRank: s.competencyRank,
      score: s.score,
      rationale: s.rationale,
    })),
  });
}
