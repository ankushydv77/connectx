"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<null | { name: string }>(null);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
  }, []);

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    router.push("/login");
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-slate-950/85 border-b border-white/10 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 md:gap-3 hover:opacity-90 transition group flex-shrink-0">
          <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 grid place-items-center text-sm md:text-lg font-bold group-hover:scale-105 transition duration-300">
            CX
          </div>
          <div className="hidden sm:block">
            <p className="text-sm md:text-base font-bold text-white tracking-tight group-hover:text-cyan-300 transition duration-300">CONNECTX</p>
            <p className="text-[10px] md:text-xs text-cyan-400 font-semibold tracking-wide uppercase">Next-Gen Conference</p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 md:gap-3 flex-wrap justify-end">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Dashboard
          </Link>
          {currentUser ? (
            <div className="flex items-center gap-1.5 md:gap-3">
              <span className="text-xs md:text-sm font-medium text-slate-400 hidden xs:inline">Hi, <span className="font-bold text-slate-200">{currentUser.name.split(" ")[0]}</span></span>
              <button
                onClick={handleLogout}
                className="rounded-full border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-white/10 bg-slate-900/40 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-white hover:bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-950 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
