import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

export async function GET() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  if (!url || !authToken) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const client = createClient({ url, authToken });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "AiScore" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "assessmentId" TEXT NOT NULL,
        "competencyRank" INTEGER NOT NULL,
        "score" INTEGER NOT NULL,
        "rationale" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AiScore_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await client.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS "AiScore_assessmentId_competencyRank_key" ON "AiScore"("assessmentId", "competencyRank")
    `);

    // Verify the table exists
    const result = await client.execute(`SELECT count(*) as cnt FROM "AiScore"`);

    return NextResponse.json({
      success: true,
      message: "AiScore table created successfully",
      rowCount: result.rows[0]?.cnt,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Migration failed",
      details: String(error),
    }, { status: 500 });
  }
}
