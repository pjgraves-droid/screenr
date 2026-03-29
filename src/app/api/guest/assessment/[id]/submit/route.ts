import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendResultsEmail } from "@/lib/email";

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

    // Check if email is already in use by another user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.id !== assessment.user.id) {
      return NextResponse.json(
        { error: "This email is already in use. Please use a different email address." },
        { status: 409 }
      );
    }

    // Update the guest user's email to the real email
    await prisma.user.update({
      where: { id: assessment.user.id },
      data: { email, name: email.split("@")[0] },
    });

    // Mark assessment as submitted
    await prisma.assessment.update({
      where: { id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });

    // Send results email
    const emailResult = await sendResultsEmail(
      email,
      assessment.responses,
      assessment.selfRatings
    );

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
