"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { competencies } from "@/lib/competencies";

interface SubmitResult {
  avgRating: number;
  ratingsCount: number;
  emailSent: boolean;
}

interface AiScore {
  competencyRank: number;
  score: number;
  rationale: string;
}

function getRatingLabel(rating: number): string {
  if (rating >= 9) return "Exceptional";
  if (rating >= 7) return "Strong";
  if (rating >= 5) return "Developing";
  if (rating >= 3) return "Emerging";
  return "Gap";
}

export default function CompletePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [reopening, setReopening] = useState(false);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [aiScores, setAiScores] = useState<AiScore[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/assessment")
        .then((res) => res.json())
        .then((data) => {
          if (data.id) setAssessmentId(data.id);
        })
        .catch(() => {});
    }
  }, [status]);

  const fetchAiScores = useCallback(async () => {
    try {
      const res = await fetch("/api/assessment/ai-scores");
      if (!res.ok) return false;
      const data = await res.json();
      if (data.scores && data.scores.length > 0) {
        setAiScores(data.scores);
        setAiLoading(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    // Initial fetch
    fetchAiScores().then((done) => {
      if (done || cancelled) return;
      // Poll every 5 seconds for up to 2 minutes
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        const done = await fetchAiScores();
        if (done || attempts >= 24 || cancelled) {
          if (pollRef.current) clearInterval(pollRef.current);
          if (!cancelled) setAiLoading(false);
        }
      }, 5000);
    });

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, fetchAiScores]);

  useEffect(() => {
    const stored = sessionStorage.getItem("submitResult");
    if (stored) {
      try {
        setSubmitResult(JSON.parse(stored));
      } catch {
        // ignore parse errors
      }
      sessionStorage.removeItem("submitResult");
    }
  }, []);

  const handleEditResubmit = async () => {
    if (!assessmentId) return;
    setReopening(true);
    try {
      const res = await fetch("/api/assessment/reopen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reopen assessment");
      }
      router.push("/survey");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reopen assessment. Please try again.");
      setReopening(false);
    }
  };

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
          <p className="text-muted mb-4">
            Thank you for completing the Executive Competency Assessment.
          </p>

          {/* Average Self-Rating */}
          {submitResult && submitResult.avgRating > 0 && (
            <div className="bg-card rounded-xl border border-card-border p-6 mb-6">
              <div className="text-sm text-muted mb-1">
                Average Self-Rating
              </div>
              <div className="text-4xl font-bold text-brand-purple mb-1">
                {submitResult.avgRating}
              </div>
              <div className="text-sm text-muted mb-1">
                {getRatingLabel(submitResult.avgRating)}
              </div>
              <div className="text-xs text-muted">
                {submitResult.ratingsCount} of {competencies.length} competencies rated
              </div>
            </div>
          )}

          {/* AI Rating */}
          {aiLoading ? (
            <div className="bg-card rounded-xl border border-card-border p-6 mb-6">
              <div className="text-sm text-muted mb-2">AI Rating</div>
              <div className="flex items-center justify-center gap-2 text-muted">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Analyzing your responses...</span>
              </div>
            </div>
          ) : aiScores.length > 0 ? (
            <div className="bg-card rounded-xl border border-card-border p-6 mb-6 text-left">
              <div className="text-sm text-muted mb-1 text-center">Average AI Rating</div>
              <div className="text-4xl font-bold text-brand-blue mb-1 text-center">
                {(aiScores.reduce((sum, s) => sum + s.score, 0) / aiScores.length).toFixed(1)}
              </div>
              <div className="text-sm text-muted mb-4 text-center">
                {getRatingLabel(aiScores.reduce((sum, s) => sum + s.score, 0) / aiScores.length)}
              </div>
              <div className="space-y-3">
                {competencies.map((c) => {
                  const aiScore = aiScores.find((s) => s.competencyRank === c.rank);
                  if (!aiScore) return null;
                  return (
                    <div key={c.rank} className="border-t border-card-border pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        <span className={`text-sm font-bold ${
                          aiScore.score >= 9 ? "text-brand-green" :
                          aiScore.score >= 7 ? "text-brand-blue" :
                          aiScore.score >= 5 ? "text-yellow-400" :
                          aiScore.score >= 3 ? "text-orange-400" :
                          "text-red-400"
                        }`}>
                          {aiScore.score}/10 &middot; {getRatingLabel(aiScore.score)}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{aiScore.rationale}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Email Status */}
          {submitResult?.emailSent && session?.user?.email ? (
            <>
              <p className="text-brand-green text-sm mb-2">
                Your results have been sent to{" "}
                <strong>{session.user.email}</strong>.
              </p>
              <p className="text-muted text-xs mb-6">
                Don&apos;t see it? Please check your spam or junk folder.
              </p>
            </>
          ) : (
            <p className="text-muted text-sm mb-6">
              Your responses have been recorded and will be reviewed by our
              team.
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            <a
              href="/api/assessment/pdf"
              download
              className="rounded-lg bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-[#1aa584] transition-colors"
            >
              Download PDF
            </a>
            <button
              onClick={handleEditResubmit}
              disabled={reopening || !assessmentId}
              className="rounded-lg border border-brand-purple px-6 py-3 text-sm font-semibold text-brand-purple hover:bg-brand-purple/10 disabled:opacity-50 transition-colors"
            >
              {reopening ? "Reopening..." : "Edit & Resubmit"}
            </button>
            <Link
              href="/"
              className="rounded-lg bg-brand-purple px-6 py-3 text-sm font-semibold text-white hover:bg-[#2d56a8] transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
