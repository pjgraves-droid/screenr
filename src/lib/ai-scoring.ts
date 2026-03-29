import Anthropic from "@anthropic-ai/sdk";
import { competencies } from "@/lib/competencies";
import { prisma } from "@/lib/prisma";

interface ResponseData {
  competencyRank: number;
  questionIndex: number;
  answer: string;
}

interface SelfRatingData {
  competencyRank: number;
  rating: number;
}

interface AiScoreResult {
  competencyRank: number;
  score: number;
  rationale: string;
}

function buildBatchPrompt(
  competencyBatch: typeof competencies,
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): string {
  const count = competencyBatch.length;
  const ranks = competencyBatch.map((c) => c.rank).join(", ");

  let prompt = `You are an expert executive talent assessor evaluating a candidate for a high-growth AI company (Cognition).

Score each competency from 1-10:
- 9-10 Exceptional: Best-in-class evidence
- 7-8 Strong: Clear, proven evidence with specific examples
- 5-6 Developing: Some evidence but gaps
- 3-4 Emerging: Limited evidence
- 1-2 Gap: No meaningful evidence

Score based on QUALITY and SPECIFICITY — concrete examples, metrics, named companies/deals. Vague or empty answers score 1-2.

Candidate responses:\n\n`;

  for (const comp of competencyBatch) {
    const compResponses = responses.filter(
      (r) => r.competencyRank === comp.rank
    );
    const selfRating = selfRatings.find(
      (r) => r.competencyRank === comp.rank
    );

    prompt += `---\nCOMPETENCY ${comp.rank}: ${comp.name} (${comp.category})\n`;
    prompt += `Description: ${comp.description}\n`;
    if (selfRating) {
      prompt += `Self-Rating: ${selfRating.rating}/10\n`;
    }
    prompt += `\n`;

    for (let qi = 0; qi < comp.questions.length; qi++) {
      const answer =
        compResponses.find((r) => r.questionIndex === qi)?.answer || "";
      prompt += `Q${qi + 1}: ${comp.questions[qi]}\n`;
      prompt += `A: ${answer || "(No response)"}\n\n`;
    }
  }

  prompt += `---\n\nRespond with a JSON array of EXACTLY ${count} objects for competency ranks ${ranks}. Each object:
- "competencyRank": number
- "score": number (1-10)
- "rationale": string (1 sentence)

Return ONLY the JSON array.`;

  return prompt;
}

function parseAndValidateScores(rawText: string): AiScoreResult[] {
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error("Could not parse AI response as JSON array");
  }

  const scores: AiScoreResult[] = JSON.parse(jsonMatch[0]);

  return scores
    .filter(
      (s) =>
        typeof s.competencyRank === "number" &&
        typeof s.score === "number" &&
        typeof s.rationale === "string" &&
        s.competencyRank >= 1 &&
        s.competencyRank <= 10
    )
    .map((s) => ({
      competencyRank: s.competencyRank,
      score: Math.min(10, Math.max(1, Math.round(s.score))),
      rationale: s.rationale.slice(0, 500),
    }));
}

async function scoreBatch(
  client: Anthropic,
  batch: typeof competencies,
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): Promise<AiScoreResult[]> {
  const prompt = buildBatchPrompt(batch, responses, selfRatings);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from AI model");
  }

  const validated = parseAndValidateScores(textBlock.text.trim());

  // Deduplicate by competencyRank
  const seen = new Set<number>();
  return validated.filter((s) => {
    if (seen.has(s.competencyRank)) return false;
    seen.add(s.competencyRank);
    return true;
  });
}

export async function scoreAssessment(
  assessmentId: string,
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): Promise<AiScoreResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });

  // Split competencies into two batches and score in parallel
  const mid = Math.ceil(competencies.length / 2);
  const batch1 = competencies.slice(0, mid);
  const batch2 = competencies.slice(mid);

  const [results1, results2] = await Promise.allSettled([
    scoreBatch(client, batch1, responses, selfRatings),
    scoreBatch(client, batch2, responses, selfRatings),
  ]);

  const allScores: AiScoreResult[] = [];

  if (results1.status === "fulfilled") {
    allScores.push(...results1.value);
  } else {
    console.error("AI scoring batch 1 failed:", results1.reason);
  }

  if (results2.status === "fulfilled") {
    allScores.push(...results2.value);
  } else {
    console.error("AI scoring batch 2 failed:", results2.reason);
  }

  console.log(
    `AI scoring complete: ${allScores.length}/${competencies.length} competencies scored`
  );

  return allScores;
}

export async function scoreAndSave(
  assessmentId: string,
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): Promise<AiScoreResult[]> {
  const scores = await scoreAssessment(assessmentId, responses, selfRatings);

  // Upsert scores into the database
  for (const score of scores) {
    await prisma.aiScore.upsert({
      where: {
        assessmentId_competencyRank: {
          assessmentId,
          competencyRank: score.competencyRank,
        },
      },
      update: {
        score: score.score,
        rationale: score.rationale,
      },
      create: {
        assessmentId,
        competencyRank: score.competencyRank,
        score: score.score,
        rationale: score.rationale,
      },
    });
  }

  return scores;
}
