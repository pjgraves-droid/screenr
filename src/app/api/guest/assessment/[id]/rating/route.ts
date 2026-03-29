import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { competencyRank, rating } = await request.json();

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { user: { select: { role: true } } },
    });

    if (!assessment || assessment.user.role !== "GUEST") {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status === "SUBMITTED") {
      return NextResponse.json({ error: "Assessment already submitted" }, { status: 400 });
    }

    const selfRating = await prisma.selfRating.upsert({
      where: {
        assessmentId_competencyRank: {
          assessmentId: id,
          competencyRank,
        },
      },
      update: { rating },
      create: {
        assessmentId: id,
        competencyRank,
        rating,
      },
    });

    return NextResponse.json(selfRating);
  } catch (error) {
    console.error("Guest rating PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }
}
