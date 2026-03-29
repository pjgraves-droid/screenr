"use client";

import { useState, useEffect, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { competencies, categoryLabels, categoryColors, scoringGuide } from "@/lib/competencies";

interface ResponseItem {
  competencyRank: number;
  questionIndex: number;
  answer: string;
}

interface SelfRatingItem {
  competencyRank: number;
  rating: number;
}

interface AdminRatingItem {
  competencyRank: number;
  rating: number;
  notes: string | null;
  adminUserId: string;
}

interface AiScoreItem {
  competencyRank: number;
  score: number;
  rationale: string;
}

interface AssessmentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface AssessmentDetail {
  id: string;
  status: string;
  submittedAt: string | null;
  user: AssessmentUser;
  responses: ResponseItem[];
  selfRatings: SelfRatingItem[];
  adminRatings: AdminRatingItem[];
  aiScores: AiScoreItem[];
}

export default function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminRatings, setAdminRatings] = useState<
    Record<number, { rating: number; notes: string }>
  >({});
  const [savingRating, setSavingRating] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetch(`/api/admin/assessments/${id}`)
        .then((res) => res.json())
        .then((data: AssessmentDetail) => {
          setAssessment(data);
          const ratingMap: Record<number, { rating: number; notes: string }> = {};
          data.adminRatings.forEach((r) => {
            ratingMap[r.competencyRank] = {
              rating: r.rating,
              notes: r.notes || "",
            };
          });
          setAdminRatings(ratingMap);
          setLoading(false);
        });
    }
  }, [status, session, id]);

  const saveAdminRating = async (competencyRank: number) => {
    if (!assessment) return;
    const ratingData = adminRatings[competencyRank];
    if (!ratingData || !ratingData.rating) return;
    setSavingRating(competencyRank);
    try {
      await fetch("/api/admin/rate", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: assessment.id,
          competencyRank,
          rating: ratingData.rating,
          notes: ratingData.notes || null,
        }),
      });
    } finally {
      setSavingRating(null);
    }
  };

  const getResponseForQuestion = (rank: number, qi: number) => {
    if (!assessment) return "";
    const resp = assessment.responses.find(
      (r) => r.competencyRank === rank && r.questionIndex === qi
    );
    return resp?.answer || "";
  };

  const getSelfRating = (rank: number) => {
    if (!assessment) return null;
    const r = assessment.selfRatings.find((r) => r.competencyRank === rank);
    return r?.rating || null;
  };

  const getAiScore = (rank: number) => {
    if (!assessment) return null;
    return assessment.aiScores.find((s) => s.competencyRank === rank) || null;
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return "Exceptional";
    if (rating >= 7) return "Strong";
    if (rating >= 5) return "Developing";
    if (rating >= 3) return "Emerging";
    return "Gap";
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "text-brand-green bg-brand-green/10 border-brand-green/30";
    if (rating >= 7) return "text-brand-blue bg-brand-blue/10 border-brand-blue/30";
    if (rating >= 5) return "text-amber-400 bg-amber-900/20 border-amber-800/30";
    if (rating >= 3) return "text-orange-400 bg-orange-900/20 border-orange-800/30";
    return "text-red-400 bg-red-900/20 border-red-800/30";
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted">Loading...</div>
        </main>
      </>
    );
  }

  if (!assessment) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted">Assessment not found</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin"
              className="text-sm text-brand-purple hover:text-brand-blue mb-2 inline-block"
            >
              &larr; Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  {assessment.user.name || "Unnamed Candidate"}
                  {assessment.user.role === "GUEST" && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-900/20 text-amber-400 border border-amber-800/30">
                      Guest
                    </span>
                  )}
                </h1>
                <p className="text-muted">
                  {assessment.user.email} &middot; Submitted{" "}
                  {assessment.submittedAt
                    ? new Date(assessment.submittedAt).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Ratings */}
          <div className="bg-card rounded-xl border border-card-border p-6 mb-6">
            <h2 className="text-sm font-semibold text-muted mb-4">
              Rating Summary
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {competencies.map((c) => {
                const selfR = getSelfRating(c.rank);
                const adminR = adminRatings[c.rank]?.rating;
                return (
                  <div
                    key={c.rank}
                    className="text-center p-3 rounded-lg border border-card-border"
                  >
                    <div className="text-xs text-muted mb-1 truncate">
                      {c.rank}. {c.name}
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      {selfR && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getRatingColor(selfR)}`}
                          title="Self rating"
                        >
                          S: {selfR}
                        </span>
                      )}
                      {(() => {
                        const ai = getAiScore(c.rank);
                        return ai ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getRatingColor(ai.score)}`}
                            title={`AI: ${ai.rationale}`}
                          >
                            AI: {ai.score}
                          </span>
                        ) : null;
                      })()}
                      {adminR && (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getRatingColor(adminR)}`}
                          title="Admin rating"
                        >
                          A: {adminR}
                        </span>
                      )}
                      {!selfR && !adminR && !getAiScore(c.rank) && (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scoring Guide */}
          <div className="bg-card rounded-xl border border-card-border p-4 mb-6">
            <div className="flex flex-wrap gap-3 text-xs">
              {scoringGuide.map((s) => (
                <span key={s.range} className="text-muted">
                  <span className="font-bold text-foreground">{s.range}</span> ={" "}
                  {s.level}
                </span>
              ))}
            </div>
          </div>

          {/* Competency Responses */}
          <div className="space-y-6">
            {competencies.map((c) => {
              const selfRating = getSelfRating(c.rank);
              const currentAdminRating = adminRatings[c.rank] || {
                rating: 0,
                notes: "",
              };

              return (
                <div
                  key={c.rank}
                  className="bg-card rounded-xl border border-card-border overflow-hidden"
                >
                  {/* Competency Header */}
                  <div className="p-6 border-b border-card-border">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple/15 text-brand-purple font-bold text-sm shrink-0">
                          {c.rank}
                        </span>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {c.name}
                          </h3>
                          <span
                            className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColors[c.category]}`}
                          >
                            {categoryLabels[c.category]}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-start gap-2 sm:gap-4 mt-2 sm:mt-0 sm:text-right">
                        {(() => {
                          const ai = getAiScore(c.rank);
                          return ai ? (
                            <div>
                              <div className="text-xs text-muted">AI Score</div>
                              <span
                                className={`inline-block mt-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold border ${getRatingColor(ai.score)}`}
                              >
                                {ai.score}/10 - {getRatingLabel(ai.score)}
                              </span>
                            </div>
                          ) : null;
                        })()}
                        {selfRating && (
                          <div>
                            <div className="text-xs text-muted">
                              Self-Rating
                            </div>
                            <span
                              className={`inline-block mt-1 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-bold border ${getRatingColor(selfRating)}`}
                            >
                              {selfRating}/10 - {getRatingLabel(selfRating)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="p-6 space-y-5">
                    {c.questions.map((question, qi) => {
                      const answer = getResponseForQuestion(c.rank, qi);
                      return (
                        <div key={qi}>
                          <div className="text-sm font-medium text-foreground mb-1">
                            <span className="text-brand-blue">
                              Q{qi + 1}.
                            </span>{" "}
                            {question}
                          </div>
                          <div className="bg-background rounded-lg p-4 text-sm text-foreground/90 whitespace-pre-wrap border border-card-border">
                            {answer || (
                              <span className="text-muted italic">
                                No response provided
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* AI Rationale */}
                  {(() => {
                    const ai = getAiScore(c.rank);
                    return ai ? (
                      <div className="px-6 py-4 bg-brand-blue/5 border-t border-card-border">
                        <h4 className="text-sm font-semibold text-brand-blue mb-1">
                          AI Analysis
                        </h4>
                        <p className="text-sm text-foreground/80">
                          {ai.rationale}
                        </p>
                      </div>
                    ) : null;
                  })()}

                  {/* Admin Rating */}
                  <div className="p-6 bg-brand-purple/5 border-t border-card-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Admin Rating
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-muted mb-1">
                          Rating (1-10)
                        </label>
                        <div className="grid grid-cols-5 sm:flex gap-1">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                            <button
                              key={n}
                              onClick={() =>
                                setAdminRatings((prev) => ({
                                  ...prev,
                                  [c.rank]: {
                                    ...prev[c.rank],
                                    rating: n,
                                    notes: prev[c.rank]?.notes || "",
                                  },
                                }))
                              }
                              className={`h-8 rounded text-xs font-medium transition-all ${
                                currentAdminRating.rating === n
                                  ? "bg-brand-purple text-white shadow-md"
                                  : "bg-card-border text-muted border border-card-border hover:bg-[#2a2d40]"
                              } sm:w-8`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-muted mb-1">
                            Notes (optional)
                          </label>
                          <input
                            type="text"
                            value={currentAdminRating.notes}
                            onChange={(e) =>
                              setAdminRatings((prev) => ({
                                ...prev,
                                [c.rank]: {
                                  ...prev[c.rank],
                                  rating: prev[c.rank]?.rating || 0,
                                  notes: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple placeholder:text-muted"
                            placeholder="Add notes about this competency..."
                          />
                        </div>
                        <button
                          onClick={() => saveAdminRating(c.rank)}
                          disabled={
                            !currentAdminRating.rating ||
                            savingRating === c.rank
                          }
                          className="rounded-lg bg-brand-purple px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d56a8] disabled:opacity-50 transition-colors self-end"
                        >
                          {savingRating === c.rank ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
