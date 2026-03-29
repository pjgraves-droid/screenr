import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateResultsPdf } from "@/lib/pdf";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessment = await prisma.assessment.findFirst({
      where: { userId: session.user.id, status: "SUBMITTED" },
      include: {
        responses: true,
        selfRatings: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "No submitted assessment found" },
        { status: 404 }
      );
    }

    const pdfBuffer = generateResultsPdf(
      assessment.responses,
      assessment.selfRatings
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition":
          'attachment; filename="Executive-Competency-Assessment.pdf"',
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
