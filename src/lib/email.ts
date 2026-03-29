import { Resend } from "resend";
import { competencies, categoryLabels } from "@/lib/competencies";

interface ResponseData {
  competencyRank: number;
  questionIndex: number;
  answer: string;
}

interface SelfRatingData {
  competencyRank: number;
  rating: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getRatingLabel(rating: number): string {
  if (rating >= 9) return "Exceptional";
  if (rating >= 7) return "Strong";
  if (rating >= 5) return "Developing";
  if (rating >= 3) return "Emerging";
  return "Gap";
}

function buildResultsHtml(
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): string {
  const ratingMap = new Map<number, number>();
  selfRatings.forEach((r) => ratingMap.set(r.competencyRank, r.rating));

  const responseMap = new Map<string, string>();
  responses.forEach((r) =>
    responseMap.set(`${r.competencyRank}-${r.questionIndex}`, r.answer)
  );

  let competencyRows = "";
  for (const c of competencies) {
    const selfRating = ratingMap.get(c.rank);
    const ratingLabel = selfRating ? getRatingLabel(selfRating) : "Not rated";

    let questionsHtml = "";
    for (let qi = 0; qi < c.questions.length; qi++) {
      const answer = responseMap.get(`${c.rank}-${qi}`) || "No response";
      questionsHtml += `
        <div style="margin-bottom:12px;">
          <p style="margin:0 0 4px 0;font-weight:600;color:#333;font-size:14px;">
            Q${qi + 1}. ${c.questions[qi]}
          </p>
          <p style="margin:0;padding:10px 12px;background:#f8f9fa;border-radius:6px;color:#555;font-size:14px;line-height:1.5;">
            ${escapeHtml(answer).replace(/\n/g, "<br/>")}
          </p>
        </div>`;
    }

    competencyRows += `
      <div style="margin-bottom:24px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <div style="padding:16px;background:#f0f4ff;border-bottom:1px solid #e5e7eb;">
          <h3 style="margin:0;font-size:16px;color:#1a1a2e;">
            ${c.rank}. ${c.name}
          </h3>
          <span style="display:inline-block;margin-top:4px;font-size:12px;color:#666;">
            ${categoryLabels[c.category]}
          </span>
          ${
            selfRating
              ? `<span style="float:right;font-size:14px;font-weight:700;color:#3969CA;">
                   Self-Rating: ${selfRating}/10 (${ratingLabel})
                 </span>`
              : ""
          }
        </div>
        <div style="padding:16px;">
          ${questionsHtml}
        </div>
      </div>`;
  }

  return competencyRows;
}

export async function sendResultsEmail(
  email: string,
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — skipping email delivery");
    return { success: false, error: "Email service not configured" };
  }

  const resend = new Resend(apiKey);
  const competencyRows = buildResultsHtml(responses, selfRatings);

  const avgRating =
    selfRatings.length > 0
      ? (
          selfRatings.reduce((sum, r) => sum + r.rating, 0) /
          selfRatings.length
        ).toFixed(1)
      : "N/A";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#333;">
      <div style="text-align:center;padding:24px 0;border-bottom:2px solid #3969CA;margin-bottom:24px;">
        <h1 style="margin:0;font-size:24px;color:#1a1a2e;">
          Executive Competency Assessment Results
        </h1>
        <p style="margin:8px 0 0;color:#666;font-size:14px;">
          Cognition Executive Competency Framework
        </p>
      </div>

      <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center;">
        <div style="font-size:14px;color:#666;">Average Self-Rating</div>
        <div style="font-size:32px;font-weight:700;color:#3969CA;">${avgRating}</div>
        <div style="font-size:12px;color:#888;">${selfRatings.length} of ${competencies.length} competencies rated</div>
      </div>

      ${competencyRows}

      <div style="text-align:center;padding:24px 0;border-top:1px solid #e5e7eb;margin-top:24px;color:#888;font-size:12px;">
        This assessment was completed using the Cognition Executive Competency Framework.
      </div>
    </body>
    </html>`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Assessment <noreply@resend.dev>",
      to: email,
      subject: "Your Executive Competency Assessment Results",
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send results email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}
