import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResultsEmail } from "@/lib/email";
import { generateResultsPdf } from "@/lib/pdf";
import { scoreAndSave } from "@/lib/ai-scoring";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, role: true } },
        responses: true,
        selfRatings: true,
      },
    });

    if (!assessment || assessment.user.role !== "GUEST") {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    if (assessment.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Assessment already submitted" },
        { status: 400 }
      );
    }

    // Store contact email on assessment and mark as submitted
    // Note: We do NOT update User.email to prevent email squatting attacks
    // where an attacker claims a legitimate user's email via the guest flow.
    await prisma.assessment.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        contactEmail: email,
        submittedAt: new Date(),
      },
    });

    // Generate PDF (non-blocking — submission succeeds even if PDF fails)
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = generateResultsPdf(
        assessment.responses,
        assessment.selfRatings
      );
    } catch (pdfErr) {
      console.error("PDF generation failed, sending email without attachment:", pdfErr);
    }

    // Send results email with PDF attachment (if available)
    const emailResult = await sendResultsEmail(
      email,
      assessment.responses,
      assessment.selfRatings,
      pdfBuffer
    );

    // Run AI scoring (non-blocking — submission succeeds even if AI fails)
    scoreAndSave(id, assessment.responses, assessment.selfRatings).catch((aiErr) => {
      console.error("AI scoring failed:", aiErr);
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
    });
  } catch (error) {
    console.error("Guest submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit assessment" },
      { status: 500 }
    );
  }
}
