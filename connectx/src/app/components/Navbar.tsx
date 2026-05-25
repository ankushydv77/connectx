"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  X,
  Video,
  MessageSquare,
  Globe2,
  Home,
  User,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: <Home className="w-4 h-4" /> },
  {
    href: "/features",
    label: "Features",
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    href: "/how-it-works",
    label: "How it works",
    icon: <Globe2 className="w-4 h-4" />,
  },
  { href: "/meet", label: "Meet", icon: <Video className="w-4 h-4" /> },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: <MessageSquare className="w-4 h-4" />,
  },
  { href: "/profile", label: "Profile", icon: <User className="w-4 h-4" /> },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 glass border-b border-slate-200/80 backdrop-blur-xl shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/20">
            C
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-slate-900">
              CONNECTX
            </p>
            <p className="text-xs text-slate-500">Video meeting & chat clone</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-2 flex-1 justify-center">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition"
          >
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="md:hidden rounded-full p-2 text-slate-700 hover:bg-slate-100 transition"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  pathname === item.href
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
            <div className="border-t border-slate-200/80 pt-4 flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 transition"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
