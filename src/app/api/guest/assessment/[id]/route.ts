import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        responses: true,
        selfRatings: true,
        user: { select: { role: true } },
      },
    });

    if (!assessment || assessment.user.role !== "GUEST") {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: assessment.id,
      status: assessment.status,
      responses: assessment.responses,
      selfRatings: assessment.selfRatings,
    });
  } catch (error) {
    console.error("Guest assessment GET error:", error);
    return NextResponse.json(
      { error: "Failed to load assessment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { competencyRank, questionIndex, answer } = body;

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

    const response = await prisma.response.upsert({
      where: {
        assessmentId_competencyRank_questionIndex: {
          assessmentId: id,
          competencyRank,
          questionIndex,
        },
      },
      update: { answer },
      create: {
        assessmentId: id,
        competencyRank,
        questionIndex,
        answer,
      },
    });

    await prisma.assessment.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Guest assessment PUT error:", error);
    return NextResponse.json(
      { error: "Failed to save response" },
      { status: 500 }
    );
  }
}
