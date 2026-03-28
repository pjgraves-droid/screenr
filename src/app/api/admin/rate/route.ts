import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assessmentId, competencyRank, rating, notes } = await request.json();

  if (!assessmentId || !competencyRank || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }
  if (assessment.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Assessment not submitted" }, { status: 400 });
  }

  const adminRating = await prisma.adminRating.upsert({
    where: {
      assessmentId_competencyRank_adminUserId: {
        assessmentId,
        competencyRank,
        adminUserId: session.user.id,
      },
    },
    update: { rating, notes },
    create: {
      assessmentId,
      competencyRank,
      rating,
      notes,
      adminUserId: session.user.id,
    },
  });

  return NextResponse.json(adminRating);
}
