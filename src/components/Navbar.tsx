"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-[#1a2035] border-b border-[#2a3050]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/acumen_logo.png"
                alt="Acumen"
                width={360}
                height={120}
                className="h-48 w-auto"
                priority
              />
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="text-sm font-medium text-muted hover:text-brand-purple transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-muted">
                  {session.user.email}
                </span>
                {session.user.role === "CANDIDATE" && (
                  <Link
                    href="/survey"
                    className="text-sm font-medium text-brand-blue hover:text-brand-purple"
                  >
                    My Assessment
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-md bg-card-border px-3 py-2 text-sm font-medium text-foreground hover:bg-[#2a2d40] transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted hover:text-brand-purple transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="rounded-md bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-[#2d56a8] transition-colors"
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
