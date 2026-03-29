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
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      },
      responses: true,
      selfRatings: true,
      adminRatings: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  // For guest assessments, use contactEmail instead of the temporary user email
  const enriched = assessments.map((a) => ({
    ...a,
    user: {
      ...a.user,
      email: a.contactEmail && a.user.role === "GUEST" ? a.contactEmail : a.user.email,
      name: a.contactEmail && a.user.role === "GUEST" ? a.contactEmail.split("@")[0] : a.user.name,
    },
  }));

  return NextResponse.json(enriched);
}
