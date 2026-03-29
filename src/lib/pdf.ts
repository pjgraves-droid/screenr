import { jsPDF } from "jspdf";
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

function getRatingLabel(rating: number): string {
  if (rating >= 9) return "Exceptional";
  if (rating >= 7) return "Strong";
  if (rating >= 5) return "Developing";
  if (rating >= 3) return "Emerging";
  return "Gap";
}

// Brand colors
const PURPLE = [57, 105, 202] as const;
const DARK_BG = [18, 27, 44] as const;

export function generateResultsPdf(
  responses: ResponseData[],
  selfRatings: SelfRatingData[]
): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Build lookup maps
  const ratingMap = new Map<number, number>();
  selfRatings.forEach((r) => ratingMap.set(r.competencyRank, r.rating));

  const responseMap = new Map<string, string>();
  responses.forEach((r) =>
    responseMap.set(`${r.competencyRank}-${r.questionIndex}`, r.answer)
  );

  // --- Header ---
  doc.setFillColor(...DARK_BG);
  doc.rect(0, 0, pageWidth, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Executive Competency Assessment Results", pageWidth / 2, 16, {
    align: "center",
  });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Cognition Executive Competency Framework", pageWidth / 2, 24, {
    align: "center",
  });
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 200);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    pageWidth / 2,
    31,
    { align: "center" }
  );
  y = 46;

  // --- Summary Box ---
  const avgRating =
    selfRatings.length > 0
      ? selfRatings.reduce((sum, r) => sum + r.rating, 0) / selfRatings.length
      : 0;

  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "F");

  doc.setTextColor(...PURPLE);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(
    avgRating > 0 ? avgRating.toFixed(1) : "N/A",
    pageWidth / 2,
    y + 10,
    { align: "center" }
  );
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Average Self-Rating  |  ${selfRatings.length} of ${competencies.length} competencies rated`,
    pageWidth / 2,
    y + 18,
    { align: "center" }
  );
  y += 32;

  // --- Competency Sections ---
  for (const c of competencies) {
    const selfRating = ratingMap.get(c.rank);
    const ratingLabel = selfRating ? getRatingLabel(selfRating) : "Not rated";

    // Estimate height needed for header
    checkPageBreak(30);

    // Competency header bar
    doc.setFillColor(240, 244, 255);
    doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

    doc.setTextColor(26, 26, 46);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${c.rank}. ${c.name}`, margin + 4, y + 6);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(categoryLabels[c.category], margin + 4, y + 11.5);

    if (selfRating) {
      doc.setTextColor(...PURPLE);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(
        `Self-Rating: ${selfRating}/10 (${ratingLabel})`,
        margin + contentWidth - 4,
        y + 6,
        { align: "right" }
      );
    }

    y += 18;

    // Questions and answers
    for (let qi = 0; qi < c.questions.length; qi++) {
      const answer = responseMap.get(`${c.rank}-${qi}`) || "No response";

      checkPageBreak(20);

      // Question text
      doc.setTextColor(26, 26, 46);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      const qLines = doc.splitTextToSize(
        `Q${qi + 1}. ${c.questions[qi]}`,
        contentWidth - 8
      );
      doc.text(qLines, margin + 4, y);
      y += qLines.length * 4 + 2;

      // Answer text
      checkPageBreak(10);
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const aLines = doc.splitTextToSize(answer, contentWidth - 8);
      // Draw answer background
      const answerHeight = aLines.length * 4 + 4;
      checkPageBreak(answerHeight + 2);
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(
        margin + 2,
        y - 3,
        contentWidth - 4,
        answerHeight,
        2,
        2,
        "F"
      );
      doc.text(aLines, margin + 6, y);
      y += answerHeight + 4;
    }

    y += 4; // spacing between competencies
  }

  // --- Footer ---
  checkPageBreak(16);
  doc.setDrawColor(200, 200, 210);
  doc.line(margin, y, margin + contentWidth, y);
  y += 6;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(
    "This assessment was completed using the Cognition Executive Competency Framework.",
    pageWidth / 2,
    y,
    { align: "center" }
  );

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
