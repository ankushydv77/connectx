"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/95 border-b border-slate-200 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-slate-900 text-white grid place-items-center text-lg font-semibold">
            M
          </div>
          <div>
            <p className="text-base font-semibold text-slate-950">Meet Clone</p>
            <p className="text-xs text-slate-500">Google Meet style UI</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
          >
            Home
          </Link>
          <Link
            href="/meet"
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Join meeting
          </Link>
        </div>
      </div>
    </header>
  );
}
