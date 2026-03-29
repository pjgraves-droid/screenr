import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.assessment.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
      responses: true,
      selfRatings: true,
      adminRatings: true,
      aiScores: true,
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // For guest assessments, use contactEmail instead of the temporary user email
  const result = assessment.contactEmail && assessment.user.role === "GUEST"
    ? {
        ...assessment,
        user: {
          ...assessment.user,
          email: assessment.contactEmail,
          name: assessment.contactEmail.split("@")[0],
        },
      }
    : assessment;

  return NextResponse.json(result);
}
