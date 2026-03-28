"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { competencies, categoryLabels, categoryColors } from "@/lib/competencies";

interface ResponseData {
  competencyRank: number;
  questionIndex: number;
  answer: string;
}

interface SelfRatingData {
  competencyRank: number;
  rating: number;
}

interface AssessmentData {
  id: string;
  status: string;
  responses: ResponseData[];
  selfRatings: SelfRatingData[];
}

export default function SurveyPage() {
  const { status } = useSession();
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/assessment")
        .then((res) => res.json())
        .then((data: AssessmentData) => {
          setAssessment(data);
          if (data.status === "SUBMITTED") {
            router.push("/survey/complete");
            return;
          }
          const answerMap: Record<string, string> = {};
          data.responses.forEach((r: ResponseData) => {
            answerMap[`${r.competencyRank}-${r.questionIndex}`] = r.answer;
          });
          setAnswers(answerMap);
          const ratingMap: Record<number, number> = {};
          data.selfRatings.forEach((r: SelfRatingData) => {
            ratingMap[r.competencyRank] = r.rating;
          });
          setRatings(ratingMap);
        });
    }
  }, [status, router]);

  const saveAnswer = useCallback(
    async (competencyRank: number, questionIndex: number, answer: string) => {
      if (!assessment) return;
      setSaving(true);
      try {
        await fetch("/api/assessment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assessmentId: assessment.id,
            competencyRank,
            questionIndex,
            answer,
          }),
        });
        setLastSaved(new Date().toLocaleTimeString());
      } finally {
        setSaving(false);
      }
    },
    [assessment]
  );

  const saveRating = async (competencyRank: number, rating: number) => {
    if (!assessment) return;
    setRatings((prev) => ({ ...prev, [competencyRank]: rating }));
    await fetch("/api/assessment/rating", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentId: assessment.id,
        competencyRank,
        rating,
      }),
    });
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleAnswerChange = (
    competencyRank: number,
    questionIndex: number,
    value: string
  ) => {
    const key = `${competencyRank}-${questionIndex}`;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleAnswerBlur = (competencyRank: number, questionIndex: number) => {
    const key = `${competencyRank}-${questionIndex}`;
    const answer = answers[key] || "";
    saveAnswer(competencyRank, questionIndex, answer);
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    if (!confirm("Are you sure you want to submit? You won't be able to edit your responses after submission.")) return;
    setSubmitting(true);
    try {
      await fetch("/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId: assessment.id }),
      });
      router.push("/survey/complete");
    } catch {
      setSubmitting(false);
    }
  };

  const competency = competencies[currentStep];
  const answeredQuestions = competency
    ? competency.questions.filter(
        (_, qi) => (answers[`${competency.rank}-${qi}`] || "").trim().length > 0
      ).length
    : 0;

  const totalAnswered = competencies.reduce((acc, c) => {
    return (
      acc +
      c.questions.filter(
        (_, qi) => (answers[`${c.rank}-${qi}`] || "").trim().length > 0
      ).length
    );
  }, 0);
  const totalQuestions = competencies.reduce((acc, c) => acc + c.questions.length, 0);
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  if (status === "loading" || !assessment) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-500">Loading assessment...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-slate-900">
                Competency Assessment
              </h1>
              <div className="flex items-center gap-3">
                {saving && (
                  <span className="text-xs text-amber-600">Saving...</span>
                )}
                {lastSaved && !saving && (
                  <span className="text-xs text-slate-400">
                    Last saved {lastSaved}
                  </span>
                )}
                <span className="text-sm font-medium text-slate-600">
                  {totalAnswered}/{totalQuestions} questions &middot; {progressPercent}%
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar Navigation */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
                <div className="p-3 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Competencies
                  </h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {competencies.map((c, idx) => {
                    const answered = c.questions.filter(
                      (_, qi) =>
                        (answers[`${c.rank}-${qi}`] || "").trim().length > 0
                    ).length;
                    const hasRating = ratings[c.rank] !== undefined;
                    const isComplete = answered === c.questions.length && hasRating;

                    return (
                      <button
                        key={c.rank}
                        onClick={() => setCurrentStep(idx)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                          currentStep === idx
                            ? "bg-indigo-50 text-indigo-700 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                              isComplete
                                ? "bg-emerald-100 text-emerald-700"
                                : currentStep === idx
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {isComplete ? "\u2713" : c.rank}
                          </span>
                          <span className="truncate">{c.name}</span>
                        </div>
                        <div className="ml-7 mt-0.5 text-xs text-slate-400">
                          {answered}/{c.questions.length} answered
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="col-span-12 lg:col-span-9">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
                {/* Competency Header */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-lg shrink-0">
                      {competency.rank}
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {competency.name}
                      </h2>
                      <span
                        className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${categoryColors[competency.category]}`}
                      >
                        {categoryLabels[competency.category]}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">
                    {competency.description}
                  </p>
                  <div className="text-xs text-slate-400">
                    <span className="font-medium">Founders Fund Principle:</span>{" "}
                    {competency.foundersFundPrinciple} &middot;{" "}
                    <span className="font-medium">Cognition Signal:</span>{" "}
                    {competency.cognitionSignal}
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                  {competency.questions.map((question, qi) => {
                    const key = `${competency.rank}-${qi}`;
                    return (
                      <div key={qi}>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          <span className="text-indigo-500 mr-1">
                            Q{qi + 1}.
                          </span>
                          {question}
                        </label>
                        <textarea
                          value={answers[key] || ""}
                          onChange={(e) =>
                            handleAnswerChange(
                              competency.rank,
                              qi,
                              e.target.value
                            )
                          }
                          onBlur={() =>
                            handleAnswerBlur(competency.rank, qi)
                          }
                          rows={4}
                          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
                          placeholder="Share your honest, detailed response..."
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Self Rating */}
                <div className="mt-8 pt-6 border-t border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">
                    Self-Assessment Rating (1-10)
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Rate yourself honestly on this competency. 9-10 = Exceptional, 7-8 = Strong, 5-6 = Developing, 3-4 = Emerging, 1-2 = Gap
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => saveRating(competency.rank, n)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          ratings[competency.rank] === n
                            ? "bg-indigo-600 text-white shadow-md scale-110"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    &larr; Previous
                  </button>

                  <span className="text-sm text-slate-400">
                    {answeredQuestions}/{competency.questions.length} answered
                  </span>

                  {currentStep < competencies.length - 1 ? (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      Next &rarr;
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || totalAnswered === 0}
                      className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? "Submitting..." : "Submit Assessment"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
