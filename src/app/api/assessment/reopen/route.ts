import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assessmentId } = await request.json();

  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, userId: session.user.id },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Assessment is not submitted" }, { status: 400 });
  }

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      status: "DRAFT",
    },
  });

  return NextResponse.json({ success: true });
}
