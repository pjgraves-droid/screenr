import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateResultsPdf } from "@/lib/pdf";

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
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    if (assessment.status !== "SUBMITTED") {
      return NextResponse.json(
        { error: "Assessment has not been submitted yet" },
        { status: 400 }
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
