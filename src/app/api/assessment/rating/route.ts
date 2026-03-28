import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assessmentId, competencyRank, rating } = await request.json();

  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, userId: session.user.id },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.status === "SUBMITTED") {
    return NextResponse.json({ error: "Assessment already submitted" }, { status: 400 });
  }

  const selfRating = await prisma.selfRating.upsert({
    where: {
      assessmentId_competencyRank: {
        assessmentId,
        competencyRank,
      },
    },
    update: { rating },
    create: {
      assessmentId,
      competencyRank,
      rating,
    },
  });

  return NextResponse.json(selfRating);
}
