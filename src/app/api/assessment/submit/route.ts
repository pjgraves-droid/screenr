import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendResultsEmail } from "@/lib/email";
import { generateResultsPdf } from "@/lib/pdf";
import { scoreAndSave } from "@/lib/ai-scoring";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { assessmentId } = await request.json();

  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, userId: session.user.id },
    include: {
      responses: true,
      selfRatings: true,
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  if (assessment.status === "SUBMITTED") {
    return NextResponse.json({ error: "Assessment already submitted" }, { status: 400 });
  }

  await prisma.assessment.update({
    where: { id: assessmentId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  // Calculate average self-rating
  const avgRating =
    assessment.selfRatings.length > 0
      ? assessment.selfRatings.reduce((sum, r) => sum + r.rating, 0) /
        assessment.selfRatings.length
      : 0;

  // Generate PDF (non-blocking — submission succeeds even if PDF fails)
  let pdfBuffer: Buffer | undefined;
  try {
    pdfBuffer = generateResultsPdf(
      assessment.responses,
      assessment.selfRatings
    );
  } catch (pdfErr) {
    console.error("PDF generation failed:", pdfErr);
  }

  // Send results email to the authenticated user
  let emailSent = false;
  if (session.user.email) {
    try {
      const emailResult = await sendResultsEmail(
        session.user.email,
        assessment.responses,
        assessment.selfRatings,
        pdfBuffer
      );
      emailSent = emailResult.success;
    } catch (emailErr) {
      console.error("Email send failed:", emailErr);
    }
  }

  // Run AI scoring in the background (non-blocking — submission succeeds even if AI fails)
  scoreAndSave(assessmentId, assessment.responses, assessment.selfRatings).catch((aiErr) => {
    console.error("AI scoring failed:", aiErr);
  });

  return NextResponse.json({
    success: true,
    avgRating: Number(avgRating.toFixed(1)),
    ratingsCount: assessment.selfRatings.length,
    emailSent,
  });
}
