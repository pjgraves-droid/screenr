"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GuestStartButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/guest/start", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start assessment");
      const data = await res.json();
      router.push(`/survey/guest/${data.assessmentId}`);
    } catch {
      alert("Failed to start assessment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStart}
      disabled={loading}
      className="rounded-lg bg-brand-green text-white px-8 py-3 text-lg font-semibold hover:bg-[#1aa584] transition-colors shadow-lg disabled:opacity-50"
    >
      {loading ? "Starting..." : "Get Started"}
    </button>
  );
}
