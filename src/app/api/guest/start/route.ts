import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST() {
  try {
    const guestId = crypto.randomUUID();
    const guestEmail = `guest-${guestId}@screenr.guest`;
    const hashedPassword = await bcrypt.hash(guestId, 10);

    const user = await prisma.user.create({
      data: {
        email: guestEmail,
        password: hashedPassword,
        role: "GUEST",
        name: null,
      },
    });

    const assessment = await prisma.assessment.create({
      data: { userId: user.id },
      include: {
        responses: true,
        selfRatings: true,
      },
    });

    return NextResponse.json({ assessmentId: assessment.id });
  } catch (error) {
    console.error("Guest start error:", error);
    return NextResponse.json(
      { error: "Failed to start assessment" },
      { status: 500 }
    );
  }
}
