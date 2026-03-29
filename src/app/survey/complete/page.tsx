"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CompletePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
          <p className="text-muted mb-8">
            Thank you for completing the Executive Competency Assessment. Your
            responses have been recorded and will be reviewed by our team.
          </p>
          <Link
            href="/"
            className="rounded-lg bg-brand-purple px-6 py-3 text-sm font-semibold text-white hover:bg-[#2d56a8] transition-colors"
          >
            Return Home
          </Link>
        </div>
      </main>
    </>
  );
}
