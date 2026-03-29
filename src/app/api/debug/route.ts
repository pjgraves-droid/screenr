import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
    DATABASE_AUTH_TOKEN_set: !!process.env.DATABASE_AUTH_TOKEN,
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
  };

  // Check each table individually
  const tables = ["user", "assessment", "response", "selfRating", "adminRating"] as const;
  for (const table of tables) {
    try {
      const count = await (prisma[table] as { count: () => Promise<number> }).count();
      results[`${table}_table_ok`] = true;
      results[`${table}_count`] = count;
    } catch (error) {
      results[`${table}_table_ok`] = false;
      results[`${table}_error`] = error instanceof Error ? error.message : String(error);
    }
  }

  // Try full assessment creation flow
  try {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      const testAssessment = await prisma.assessment.create({
        data: { userId: firstUser.id },
        include: { responses: true, selfRatings: true },
      });
      await prisma.assessment.delete({ where: { id: testAssessment.id } });
      results.full_create_test = "ok";
    } else {
      results.full_create_test = "no users";
    }
  } catch (error) {
    results.full_create_test = "failed";
    results.full_create_error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(results);
}
