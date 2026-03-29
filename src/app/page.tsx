import Link from "next/link";
import Navbar from "@/components/Navbar";
import GuestStartButton from "@/components/GuestStartButton";
import { competencies, categoryLabels, categoryColors } from "@/lib/competencies";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#0f1118] via-[#141829] to-[#1a1f3a] text-white">
          <div className="max-w-5xl mx-auto px-4 py-10 sm:py-14 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Executive Competency Assessment
            </h1>
            <p className="text-base sm:text-lg text-muted max-w-3xl mx-auto mb-6">
              Based on the Cognition Executive Competency Framework. Evaluate
              yourself across 10 critical competencies informed by Founders
              Fund&apos;s investment thesis and Silicon Valley best practices.
            </p>
            <div className="flex flex-col items-center gap-3">
              <GuestStartButton />
              <p className="text-xs text-muted">
                No account needed &mdash; get your results emailed to you
              </p>
              <div className="flex gap-4 mt-1">
                <Link
                  href="/register"
                  className="rounded-lg border-2 border-white/20 text-white px-6 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="rounded-lg border-2 border-white/20 text-white px-6 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Competency Overview */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
            10 Competencies. One Framework.
          </h2>
          <p className="text-muted text-center mb-10 max-w-2xl mx-auto">
            Each competency is ranked by importance and mapped to Founders Fund
            principles and Cognition-specific signals.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {competencies.map((c) => (
              <div
                key={c.rank}
                className="rounded-xl border border-card-border bg-card p-5 hover:border-brand-purple/40 transition-colors"
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-purple/15 text-brand-purple font-bold text-sm shrink-0">
                    {c.rank}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{c.name}</h3>
                    <span
                      className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${categoryColors[c.category]}`}
                    >
                      {categoryLabels[c.category]}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted mt-2">{c.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring Guide */}
        <section className="bg-card border-t border-card-border">
          <div className="max-w-4xl mx-auto px-4 py-16">
            <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
              Scoring Guide
            </h2>
            <div className="overflow-hidden rounded-xl border border-card-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#161923]">
                    <th className="text-left px-4 py-3 font-semibold text-muted">Score</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted">Level</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { range: "9-10", level: "Exceptional", desc: "Best-in-class evidence. Would be a standout even at Cognition's bar.", color: "text-brand-green" },
                    { range: "7-8", level: "Strong", desc: "Clear, proven evidence with specific examples. Meets the Cognition standard.", color: "text-brand-blue" },
                    { range: "5-6", level: "Developing", desc: "Some evidence but gaps in depth, recency, or relevance.", color: "text-amber-400" },
                    { range: "3-4", level: "Emerging", desc: "Limited evidence. Requires significant development.", color: "text-orange-400" },
                    { range: "1-2", level: "Gap", desc: "No meaningful evidence. Potential risk area.", color: "text-red-400" },
                  ].map((s) => (
                    <tr key={s.range} className="border-t border-card-border">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">{s.range}</td>
                      <td className={`px-4 py-3 font-semibold ${s.color}`}>{s.level}</td>
                      <td className="px-4 py-3 text-muted">{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#080910] text-muted text-center py-6 text-sm border-t border-card-border">
        Screenr &mdash; Cognition Executive Competency Framework Assessment
      </footer>
    </>
  );
}
