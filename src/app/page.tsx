import Link from "next/link";
import Navbar from "@/components/Navbar";
import { competencies, categoryLabels, categoryColors } from "@/lib/competencies";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
          <div className="max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">
              Executive Competency Assessment
            </h1>
            <p className="text-lg sm:text-xl text-indigo-100 max-w-3xl mx-auto mb-10">
              Based on the Cognition Executive Competency Framework. Evaluate
              yourself across 10 critical competencies informed by Founders
              Fund&apos;s investment thesis and Silicon Valley best practices.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="rounded-lg bg-white text-indigo-700 px-8 py-3 text-lg font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Start Assessment
              </Link>
              <Link
                href="/login"
                className="rounded-lg border-2 border-white/30 text-white px-8 py-3 text-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Competency Overview */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">
            10 Competencies. One Framework.
          </h2>
          <p className="text-slate-500 text-center mb-10 max-w-2xl mx-auto">
            Each competency is ranked by importance and mapped to Founders Fund
            principles and Cognition-specific signals.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {competencies.map((c) => (
              <div
                key={c.rank}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
                    {c.rank}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{c.name}</h3>
                    <span
                      className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColors[c.category]}`}
                    >
                      {categoryLabels[c.category]}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">{c.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring Guide */}
        <section className="bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
              Scoring Guide
            </h2>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Score</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Level</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-700">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { range: "9-10", level: "Exceptional", desc: "Best-in-class evidence. Would be a standout even at Cognition's bar.", color: "text-emerald-700" },
                    { range: "7-8", level: "Strong", desc: "Clear, proven evidence with specific examples. Meets the Cognition standard.", color: "text-blue-700" },
                    { range: "5-6", level: "Developing", desc: "Some evidence but gaps in depth, recency, or relevance.", color: "text-amber-700" },
                    { range: "3-4", level: "Emerging", desc: "Limited evidence. Requires significant development.", color: "text-orange-700" },
                    { range: "1-2", level: "Gap", desc: "No meaningful evidence. Potential risk area.", color: "text-red-700" },
                  ].map((s) => (
                    <tr key={s.range} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-mono font-bold">{s.range}</td>
                      <td className={`px-4 py-3 font-semibold ${s.color}`}>{s.level}</td>
                      <td className="px-4 py-3 text-slate-600">{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 text-center py-6 text-sm">
        Screenr &mdash; Cognition Executive Competency Framework Assessment
      </footer>
    </>
  );
}
