"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-indigo-600">
              Screenr
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="ml-8 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-slate-500">
                  {session.user.email}
                </span>
                {session.user.role === "CANDIDATE" && (
                  <Link
                    href="/survey"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    My Assessment
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
