import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
    DATABASE_AUTH_TOKEN_set: !!process.env.DATABASE_AUTH_TOKEN,
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
  };

  try {
    const users = await prisma.user.count();
    results.db_connected = true;
    results.user_count = users;
  } catch (error) {
    results.db_connected = false;
    results.db_error = error instanceof Error ? error.message : String(error);
    results.db_error_stack = error instanceof Error ? error.stack?.split("\n").slice(0, 5) : undefined;
  }

  try {
    const assessments = await prisma.assessment.count();
    results.assessment_table_ok = true;
    results.assessment_count = assessments;
  } catch (error) {
    results.assessment_table_ok = false;
    results.assessment_error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(results);
}
