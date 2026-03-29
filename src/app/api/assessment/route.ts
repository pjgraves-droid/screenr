import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let assessment = await prisma.assessment.findFirst({
      where: { userId: session.user.id },
      include: {
        responses: true,
        selfRatings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!assessment) {
      assessment = await prisma.assessment.create({
        data: { userId: session.user.id },
        include: {
          responses: true,
          selfRatings: true,
        },
      });
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Assessment GET error:", error);
    return NextResponse.json(
      { error: "Failed to load assessment. Please try again." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { assessmentId, competencyRank, questionIndex, answer } = body;

    const assessment = await prisma.assessment.findFirst({
      where: { id: assessmentId, userId: session.user.id },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    if (assessment.status === "SUBMITTED") {
      return NextResponse.json({ error: "Assessment already submitted" }, { status: 400 });
    }

    const response = await prisma.response.upsert({
      where: {
        assessmentId_competencyRank_questionIndex: {
          assessmentId,
          competencyRank,
          questionIndex,
        },
      },
      update: { answer },
      create: {
        assessmentId,
        competencyRank,
        questionIndex,
        answer,
      },
    });

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Assessment PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save response. Please try again." },
      { status: 500 }
    );
  }
}
