"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { competencies, categoryLabels } from "@/lib/competencies";

interface AssessmentUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
}

interface SelfRatingItem {
  competencyRank: number;
  rating: number;
}

interface AdminRatingItem {
  competencyRank: number;
  rating: number;
}

interface AssessmentListItem {
  id: string;
  status: string;
  submittedAt: string | null;
  user: AssessmentUser;
  selfRatings: SelfRatingItem[];
  adminRatings: AdminRatingItem[];
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetch("/api/admin/assessments")
        .then((res) => res.json())
        .then((data) => {
          setAssessments(data);
          setLoading(false);
        });
    }
  }, [status, session]);

  const getAverageRating = (ratings: SelfRatingItem[]) => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
  };

  const getRatingColor = (avg: number) => {
    if (avg >= 9) return "text-brand-green bg-brand-green/10";
    if (avg >= 7) return "text-brand-blue bg-brand-blue/10";
    if (avg >= 5) return "text-amber-400 bg-amber-900/20";
    if (avg >= 3) return "text-orange-400 bg-orange-900/20";
    return "text-red-400 bg-red-900/20";
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

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted mt-1">
              Review submitted candidate assessments
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-card-border p-5">
              <div className="text-sm text-muted">Total Submissions</div>
              <div className="text-3xl font-bold text-foreground mt-1">
                {assessments.length}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-card-border p-5">
              <div className="text-sm text-muted">Avg Self-Rating</div>
              <div className="text-3xl font-bold text-foreground mt-1">
                {assessments.length > 0
                  ? (
                      assessments.reduce(
                        (acc, a) =>
                          acc + parseFloat(getAverageRating(a.selfRatings) as string),
                        0
                      ) / assessments.length
                    ).toFixed(1)
                  : "N/A"}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-card-border p-5">
              <div className="text-sm text-muted">Reviewed</div>
              <div className="text-3xl font-bold text-foreground mt-1">
                {assessments.filter((a) => a.adminRatings.length > 0).length}
              </div>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div className="bg-card rounded-xl border border-card-border p-12 text-center">
              <p className="text-muted">
                No assessments have been submitted yet.
              </p>
            </div>
          ) : (
            <>
            {/* Desktop table */}
            <div className="hidden sm:block bg-card rounded-xl border border-card-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#161923] border-b border-card-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted">
                      Candidate
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted">
                      Submitted
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted">
                      Self-Rating Avg
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-muted">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-muted">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {assessments.map((a) => {
                    const avg = parseFloat(getAverageRating(a.selfRatings) as string);
                    return (
                      <tr key={a.id} className="hover:bg-card-border/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {a.user.name || "Unnamed"}
                            </span>
                            {a.user.role === "GUEST" && (
                              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-900/20 text-amber-400 border border-amber-800/30">
                                Guest
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted">
                            {a.user.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {a.submittedAt
                            ? new Date(a.submittedAt).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {avg > 0 ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getRatingColor(avg)}`}
                            >
                              {avg}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {a.adminRatings.length > 0 ? (
                            <span className="text-xs font-medium text-brand-green">
                              Reviewed
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-400">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/responses/${a.id}`}
                            className="text-brand-purple hover:text-brand-blue font-medium text-sm"
                          >
                            View Details &rarr;
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {assessments.map((a) => {
                const avg = parseFloat(getAverageRating(a.selfRatings) as string);
                return (
                  <div key={a.id} className="bg-card rounded-xl border border-card-border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {a.user.name || "Unnamed"}
                          </span>
                          {a.user.role === "GUEST" && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-900/20 text-amber-400 border border-amber-800/30">
                              Guest
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted">
                          {a.user.email}
                        </div>
                      </div>
                      {a.adminRatings.length > 0 ? (
                        <span className="text-xs font-medium text-brand-green">
                          Reviewed
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-400">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">
                          {a.submittedAt
                            ? new Date(a.submittedAt).toLocaleDateString()
                            : "-"}
                        </span>
                        {avg > 0 && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getRatingColor(avg)}`}
                          >
                            Avg: {avg}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/admin/responses/${a.id}`}
                        className="text-brand-purple hover:text-brand-blue font-medium text-sm"
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}

          {/* Competency Legend */}
          <div className="mt-8 bg-card rounded-xl border border-card-border p-6">
            <h2 className="text-sm font-semibold text-muted mb-4">
              Competency Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {competencies.map((c) => (
                <div key={c.rank} className="flex items-center gap-2 text-muted">
                  <span className="font-bold text-foreground w-4">
                    {c.rank}.
                  </span>
                  {c.name}
                  <span className="text-muted/60">
                    ({categoryLabels[c.category]})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
