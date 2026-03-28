import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assessments = await prisma.assessment.findMany({
    where: { status: "SUBMITTED" },
    include: {
      user: {
        select: { id: true, name: true, email: true, createdAt: true },
      },
      responses: true,
      selfRatings: true,
      adminRatings: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(assessments);
}
