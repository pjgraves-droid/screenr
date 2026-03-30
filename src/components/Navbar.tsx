"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#121b2c] border-b border-[#1e2840]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-2 sm:py-3">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center">
              <Image
                src="/acumen-logo-final.svg"
                alt="Acumen"
                width={270}
                height={90}
                className="h-12 sm:h-20 lg:h-28 w-auto"
                priority
              />
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="hidden sm:inline text-sm font-medium text-muted hover:text-brand-purple transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-4">
            {session ? (
              <>
                <span className="text-sm text-muted hidden md:inline truncate max-w-[200px]">
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
                  Create Account
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="sm:hidden p-2 text-muted hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden border-t border-[#1e2840] py-3 space-y-2">
            {session ? (
              <>
                <div className="text-xs text-muted px-1 truncate">
                  {session.user.email}
                </div>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block px-1 py-2 text-sm font-medium text-muted hover:text-brand-purple"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {session.user.role === "CANDIDATE" && (
                  <Link
                    href="/survey"
                    onClick={() => setMenuOpen(false)}
                    className="block px-1 py-2 text-sm font-medium text-brand-blue hover:text-brand-purple"
                  >
                    My Assessment
                  </Link>
                )}
                <button
                  onClick={() => { signOut({ callbackUrl: "/" }); setMenuOpen(false); }}
                  className="block w-full text-left px-1 py-2 text-sm font-medium text-foreground hover:text-brand-purple"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block px-1 py-2 text-sm font-medium text-muted hover:text-brand-purple"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block px-1 py-2 text-sm font-medium text-brand-purple hover:text-brand-blue"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
