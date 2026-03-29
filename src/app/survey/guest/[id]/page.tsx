"use client";

import { useState, useEffect, useCallback, use } from "react";
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

export default function GuestSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: assessmentId } = use(params);
  const router = useRouter();
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    emailSent: boolean;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/guest/assessment/${assessmentId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error || `Failed to load assessment: ${res.status}`
          );
        }
        return res.json();
      })
      .then((data: AssessmentData) => {
        if (!data.id) throw new Error("Invalid assessment data");
        setAssessment(data);
        if (data.status === "SUBMITTED") {
          setSubmitResult({ success: true, emailSent: false });
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
      })
      .catch((err) => {
        console.error("Failed to load guest assessment:", err);
        setLoadError(
          err.message || "Failed to load assessment. Please refresh the page."
        );
      });
  }, [assessmentId]);

  const saveAnswer = useCallback(
    async (competencyRank: number, questionIndex: number, answer: string) => {
      if (!assessment) return;
      setSaving(true);
      try {
        await fetch(`/api/guest/assessment/${assessmentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ competencyRank, questionIndex, answer }),
        });
        setLastSaved(new Date().toLocaleTimeString());
      } finally {
        setSaving(false);
      }
    },
    [assessment, assessmentId]
  );

  const saveRating = async (competencyRank: number, rating: number) => {
    if (!assessment) return;
    setRatings((prev) => ({ ...prev, [competencyRank]: rating }));
    await fetch(`/api/guest/assessment/${assessmentId}/rating`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ competencyRank, rating }),
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

  const handleSubmitClick = () => {
    setShowEmailForm(true);
  };

  const handleEmailSubmit = async () => {
    if (!email.trim() || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/guest/assessment/${assessmentId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Submit failed");
      }
      const data = await res.json();
      setSubmitResult({ success: true, emailSent: data.emailSent });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to submit assessment";
      setEmailError(message);
      setSubmitting(false);
    }
  };

  const competency = competencies[currentStep];
  const answeredQuestions = competency
    ? competency.questions.filter(
        (_, qi) =>
          (answers[`${competency.rank}-${qi}`] || "").trim().length > 0
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
  const totalQuestions = competencies.reduce(
    (acc, c) => acc + c.questions.length,
    0
  );
  const progressPercent = Math.round((totalAnswered / totalQuestions) * 100);

  // Completion screen
  if (submitResult) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="text-center max-w-lg">
            <div className="w-16 h-16 rounded-full bg-brand-green/15 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-brand-green"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Assessment Submitted
            </h1>
            <p className="text-muted mb-2">
              Thank you for completing the Executive Competency Assessment.
            </p>
            {submitResult.emailSent && email ? (
              <>
                <p className="text-brand-green text-sm mb-2">
                  Your results have been sent to <strong>{email}</strong>.
                </p>
                <p className="text-muted text-xs mb-8">
                  Don&apos;t see it? Please check your spam or junk folder.
                </p>
              </>
            ) : email ? (
              <p className="text-amber-400 text-sm mb-8">
                Your responses have been recorded. Email delivery is not
                currently configured — please contact the administrator for your
                results.
              </p>
            ) : (
              <p className="text-muted text-sm mb-8">
                Your responses have been recorded.
              </p>
            )}
            <button
              onClick={() => router.push("/")}
              className="rounded-lg bg-brand-purple px-6 py-3 text-sm font-semibold text-white hover:bg-[#2d56a8] transition-colors"
            >
              Return Home
            </button>
          </div>
        </main>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 mb-4">{loadError}</div>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-[#2d56a8] transition-colors"
            >
              Retry
            </button>
          </div>
        </main>
      </>
    );
  }

  if (!assessment) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted">Loading assessment...</div>
        </main>
      </>
    );
  }

  // Email collection modal overlay
  if (showEmailForm) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="bg-card rounded-xl border border-card-border p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-brand-purple/15 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-brand-purple"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Almost done!
              </h2>
              <p className="text-sm text-muted mt-2">
                Enter your email to receive your assessment results.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEmailSubmit();
                  }}
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent placeholder:text-muted"
                  placeholder="you@example.com"
                  autoFocus
                />
                {emailError && (
                  <p className="text-red-400 text-xs mt-1">{emailError}</p>
                )}
              </div>

              <button
                onClick={handleEmailSubmit}
                disabled={submitting}
                className="w-full rounded-lg bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-[#1aa584] disabled:opacity-50 transition-colors"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit & Send Results"}
              </button>

              <button
                onClick={() => setShowEmailForm(false)}
                disabled={submitting}
                className="w-full rounded-lg border border-card-border px-6 py-2 text-sm font-medium text-muted hover:bg-card-border/50 disabled:opacity-50 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-bold text-foreground">
                Competency Assessment
              </h1>
              <div className="flex items-center gap-3">
                {saving && (
                  <span className="text-xs text-amber-400">Saving...</span>
                )}
                {lastSaved && !saving && (
                  <span className="text-xs text-muted">
                    Last saved {lastSaved}
                  </span>
                )}
                <span className="text-sm font-medium text-muted">
                  {totalAnswered}/{totalQuestions} questions &middot;{" "}
                  {progressPercent}%
                </span>
              </div>
            </div>
            <div className="w-full bg-card-border rounded-full h-2">
              <div
                className="bg-brand-purple h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Sidebar Navigation */}
            <div className="col-span-12 lg:col-span-3">
              <div className="bg-card rounded-xl border border-card-border overflow-hidden sticky top-8">
                <div className="p-3 bg-[#161923] border-b border-card-border">
                  <h2 className="text-sm font-semibold text-muted">
                    Competencies
                  </h2>
                </div>
                <div className="divide-y divide-card-border">
                  {competencies.map((c, idx) => {
                    const answered = c.questions.filter(
                      (_, qi) =>
                        (answers[`${c.rank}-${qi}`] || "").trim().length > 0
                    ).length;
                    const hasRating = ratings[c.rank] !== undefined;
                    const isComplete =
                      answered === c.questions.length && hasRating;

                    return (
                      <button
                        key={c.rank}
                        onClick={() => setCurrentStep(idx)}
                        className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                          currentStep === idx
                            ? "bg-brand-purple/10 text-brand-purple font-medium"
                            : "text-muted hover:bg-card-border/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                              isComplete
                                ? "bg-brand-green/15 text-brand-green"
                                : currentStep === idx
                                  ? "bg-brand-purple/15 text-brand-purple"
                                  : "bg-card-border text-muted"
                            }`}
                          >
                            {isComplete ? "\u2713" : c.rank}
                          </span>
                          <span className="truncate">{c.name}</span>
                        </div>
                        <div className="ml-7 mt-0.5 text-xs text-muted">
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
              <div className="bg-card rounded-xl border border-card-border p-6 sm:p-8">
                {/* Competency Header */}
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-purple/15 text-brand-purple font-bold text-lg shrink-0">
                      {competency.rank}
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">
                        {competency.name}
                      </h2>
                      <span
                        className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${categoryColors[competency.category]}`}
                      >
                        {categoryLabels[competency.category]}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted mb-2">
                    {competency.description}
                  </p>
                  <div className="text-xs text-muted">
                    <span className="font-medium text-foreground/70">
                      Founders Fund Principle:
                    </span>{" "}
                    {competency.foundersFundPrinciple} &middot;{" "}
                    <span className="font-medium text-foreground/70">
                      Cognition Signal:
                    </span>{" "}
                    {competency.cognitionSignal}
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-6">
                  {competency.questions.map((question, qi) => {
                    const key = `${competency.rank}-${qi}`;
                    return (
                      <div key={qi}>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          <span className="text-brand-blue mr-1">
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
                          className="w-full rounded-lg border border-card-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent resize-y placeholder:text-muted"
                          placeholder="Share your honest, detailed response..."
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Self Rating */}
                <div className="mt-8 pt-6 border-t border-card-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Self-Assessment Rating (1-10)
                  </h3>
                  <p className="text-xs text-muted mb-4">
                    Rate yourself honestly on this competency. 9-10 =
                    Exceptional, 7-8 = Strong, 5-6 = Developing, 3-4 =
                    Emerging, 1-2 = Gap
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => saveRating(competency.rank, n)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          ratings[competency.rank] === n
                            ? "bg-brand-purple text-white shadow-md scale-110"
                            : "bg-card-border text-muted hover:bg-[#2a2d40]"
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
                    onClick={() =>
                      setCurrentStep(Math.max(0, currentStep - 1))
                    }
                    disabled={currentStep === 0}
                    className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted hover:bg-card-border/50 disabled:opacity-40 transition-colors"
                  >
                    &larr; Previous
                  </button>

                  <span className="text-sm text-muted">
                    {answeredQuestions}/{competency.questions.length} answered
                  </span>

                  {currentStep < competencies.length - 1 ? (
                    <button
                      onClick={() => setCurrentStep(currentStep + 1)}
                      className="rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-[#2d56a8] transition-colors"
                    >
                      Next &rarr;
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitClick}
                      disabled={submitting || totalAnswered === 0}
                      className="rounded-lg bg-brand-green px-6 py-2 text-sm font-medium text-white hover:bg-[#1aa584] disabled:opacity-50 transition-colors"
                    >
                      Submit Assessment
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
