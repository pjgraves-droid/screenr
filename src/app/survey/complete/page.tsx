"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { competencies } from "@/lib/competencies";

interface SubmitResult {
  avgRating: number;
  ratingsCount: number;
  emailSent: boolean;
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
              disabled={reopening}
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
