import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@libsql/client";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fix = url.searchParams.get("fix") === "true";

  const results: Record<string, unknown> = {
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 20) + "...",
    DATABASE_AUTH_TOKEN_set: !!process.env.DATABASE_AUTH_TOKEN,
    AUTH_SECRET_set: !!process.env.AUTH_SECRET,
  };

  // If fix=true, run CREATE TABLE IF NOT EXISTS for all tables
  if (fix && process.env.DATABASE_URL && process.env.DATABASE_AUTH_TOKEN) {
    try {
      const client = createClient({
        url: process.env.DATABASE_URL,
        authToken: process.env.DATABASE_AUTH_TOKEN,
      });

      const migrations = [
        `CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL PRIMARY KEY, "name" TEXT, "email" TEXT NOT NULL, "password" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'CANDIDATE', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
        `CREATE TABLE IF NOT EXISTS "Assessment" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'DRAFT', "submittedAt" DATETIME, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL, CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
        `CREATE TABLE IF NOT EXISTS "Response" ("id" TEXT NOT NULL PRIMARY KEY, "assessmentId" TEXT NOT NULL, "competencyRank" INTEGER NOT NULL, "questionIndex" INTEGER NOT NULL, "answer" TEXT NOT NULL DEFAULT '', CONSTRAINT "Response_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "Response_assessmentId_competencyRank_questionIndex_key" ON "Response"("assessmentId", "competencyRank", "questionIndex")`,
        `CREATE TABLE IF NOT EXISTS "SelfRating" ("id" TEXT NOT NULL PRIMARY KEY, "assessmentId" TEXT NOT NULL, "competencyRank" INTEGER NOT NULL, "rating" INTEGER NOT NULL, CONSTRAINT "SelfRating_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "SelfRating_assessmentId_competencyRank_key" ON "SelfRating"("assessmentId", "competencyRank")`,
        `CREATE TABLE IF NOT EXISTS "AdminRating" ("id" TEXT NOT NULL PRIMARY KEY, "assessmentId" TEXT NOT NULL, "competencyRank" INTEGER NOT NULL, "rating" INTEGER NOT NULL, "notes" TEXT, "adminUserId" TEXT NOT NULL, CONSTRAINT "AdminRating_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "AdminRating_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE)`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "AdminRating_assessmentId_competencyRank_adminUserId_key" ON "AdminRating"("assessmentId", "competencyRank", "adminUserId")`,
      ];

      for (const sql of migrations) {
        await client.execute(sql);
      }
      results.migration_applied = true;
    } catch (error) {
      results.migration_applied = false;
      results.migration_error = error instanceof Error ? error.message : String(error);
    }
  }

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

  // Try full assessment creation flow (read-only check if tables exist)
  try {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      const existing = await prisma.assessment.findFirst({
        where: { userId: firstUser.id },
        include: { responses: true, selfRatings: true },
      });
      results.full_read_test = "ok";
      results.existing_assessment = !!existing;
    } else {
      results.full_read_test = "no users";
    }
  } catch (error) {
    results.full_read_test = "failed";
    results.full_read_error = error instanceof Error ? error.message : String(error);
  }

  return NextResponse.json(results);
}
