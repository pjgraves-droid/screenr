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
    if (avg >= 9) return "text-emerald-700 bg-emerald-50";
    if (avg >= 7) return "text-blue-700 bg-blue-50";
    if (avg >= 5) return "text-amber-700 bg-amber-50";
    if (avg >= 3) return "text-orange-700 bg-orange-50";
    return "text-red-700 bg-red-50";
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-slate-500">Loading...</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-1">
              Review submitted candidate assessments
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="text-sm text-slate-500">Total Submissions</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {assessments.length}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="text-sm text-slate-500">Avg Self-Rating</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
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
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="text-sm text-slate-500">Reviewed</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {assessments.filter((a) => a.adminRatings.length > 0).length}
              </div>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-slate-500">
                No assessments have been submitted yet.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Candidate
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Submitted
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Self-Rating Avg
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assessments.map((a) => {
                    const avg = parseFloat(getAverageRating(a.selfRatings) as string);
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">
                            {a.user.name || "Unnamed"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {a.user.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
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
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {a.adminRatings.length > 0 ? (
                            <span className="text-xs font-medium text-emerald-600">
                              Reviewed
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600">
                              Pending Review
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/responses/${a.id}`}
                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
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
          )}

          {/* Competency Legend */}
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Competency Reference
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {competencies.map((c) => (
                <div key={c.rank} className="flex items-center gap-2 text-slate-600">
                  <span className="font-bold text-slate-900 w-4">
                    {c.rank}.
                  </span>
                  {c.name}
                  <span className="text-slate-400">
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
