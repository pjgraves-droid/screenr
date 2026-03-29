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

function buildPrompt(
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): string {
  let prompt = `You are an expert executive talent assessor. You are evaluating a candidate's responses to an Executive Competency Assessment for a high-growth AI company (Cognition).

For each competency, score the candidate's responses from 1-10 using this scale:
- 9-10 Exceptional: Best-in-class evidence. Would be a standout.
- 7-8 Strong: Clear, proven evidence with specific examples.
- 5-6 Developing: Some evidence but gaps in depth, recency, or relevance.
- 3-4 Emerging: Limited evidence. Requires significant development.
- 1-2 Gap: No meaningful evidence.

Score based on the QUALITY and SPECIFICITY of the answers — look for concrete examples, metrics, named companies/deals, and self-awareness. Vague or generic answers should score lower. Empty or very short answers should score 1-2.

Here are the candidate's responses:\n\n`;

  for (const comp of competencies) {
    const compResponses = responses.filter(
      (r) => r.competencyRank === comp.rank
    );
    const selfRating = selfRatings.find(
      (r) => r.competencyRank === comp.rank
    );

    prompt += `---\nCOMPETENCY ${comp.rank}: ${comp.name} (${comp.category})\n`;
    prompt += `Description: ${comp.description}\n`;
    if (selfRating) {
      prompt += `Candidate Self-Rating: ${selfRating.rating}/10\n`;
    }
    prompt += `\n`;

    for (let qi = 0; qi < comp.questions.length; qi++) {
      const answer =
        compResponses.find((r) => r.questionIndex === qi)?.answer || "";
      prompt += `Q${qi + 1}: ${comp.questions[qi]}\n`;
      prompt += `A: ${answer || "(No response)"}\n\n`;
    }
  }

  prompt += `---\n\nYou MUST respond with a valid JSON array containing EXACTLY 10 objects — one for each competency (ranks 1 through 10). Do not skip any competency. Each object must have exactly these fields:
- "competencyRank": number (1-10)
- "score": number (1-10)  
- "rationale": string (1-2 sentences, be concise)

Example format:
[
  {"competencyRank": 1, "score": 7, "rationale": "Strong example of building from scratch. However, the 30-day plan lacked specificity."},
  {"competencyRank": 2, "score": 5, "rationale": "Some evidence of work ethic but lacked concrete metrics."},
  ... (continue for ALL 10 competencies)
]

IMPORTANT: You must include ALL 10 competencies (ranks 1-10). Return ONLY the JSON array, no other text.`;

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
  const prompt = buildPrompt(responses, selfRatings);
  const expectedCount = competencies.length;

  // Try up to 3 times to get all competency scores
  for (let attempt = 0; attempt < 3; attempt++) {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI model");
    }

    const validated = parseAndValidateScores(textBlock.text.trim());

    // Deduplicate: keep only the first entry per competencyRank
    const seen = new Set<number>();
    const deduped = validated.filter((s) => {
      if (seen.has(s.competencyRank)) return false;
      seen.add(s.competencyRank);
      return true;
    });

    // Check if we got all unique competencies
    if (deduped.length >= expectedCount) {
      return deduped;
    }

    // If we got some but not all, check which are missing
    const gotRanks = new Set(deduped.map((s) => s.competencyRank));
    const missingRanks = competencies
      .map((c) => c.rank)
      .filter((r) => !gotRanks.has(r));

    console.log(
      `AI scoring attempt ${attempt + 1}: got ${deduped.length}/${expectedCount} unique scores. Missing ranks: ${missingRanks.join(", ")}`
    );

    // On last attempt, return whatever we have
    if (attempt === 2) {
      return deduped;
    }
  }

  // Should not reach here, but just in case
  return [];
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
