"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [meetingCode, setMeetingCode] = useState("");
  const router = useRouter();

  const createMeeting = () => {
    const randomId = `${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    router.push(`/meet?room=${randomId}`);
  };

  const joinMeeting = () => {
    const code = meetingCode.trim();
    if (!code) {
      alert("Enter a meeting code or link to join.");
      return;
    }
    router.push(`/meet?room=${encodeURIComponent(code)}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_24%)]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-slate-700/40 blur-3xl" />
        <div className="max-w-6xl mx-auto px-6 py-24 lg:py-32 relative z-10">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300 mb-6">Meet clone</p>
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight">
                Premium video meetings. Now free for everyone.
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-300">
                Start or join a meeting with one click. Enjoy a clean Google Meet-inspired interface with instant room links and camera preview.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={createMeeting}
                  className="rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:bg-slate-100 transition"
                >
                  New meeting
                </button>
                <button
                  onClick={joinMeeting}
                  className="rounded-full border border-slate-700 bg-slate-900/80 px-8 py-4 text-sm font-semibold text-white hover:bg-slate-800 transition"
                >
                  Join with code
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { title: "Easy links", description: "Create or join meetings using short codes." },
                  { title: "No nonsense", description: "A focused interface without extra pages." },
                  { title: "Live preview", description: "See your camera before joining." },
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
                    <p className="text-sm uppercase tracking-[0.35em] text-cyan-200 mb-3">{item.title}</p>
                    <p className="text-slate-300 text-sm leading-6">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-4xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur-xl lg:max-w-lg">
              <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Meeting code</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{meetingCode || "ABC-1234"}</p>
                  </div>
                  <div className="rounded-full bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-200">
                    Ready
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-400">Meeting code or link</label>
                    <input
                      value={meetingCode}
                      onChange={(event) => setMeetingCode(event.target.value)}
                      placeholder="abc-1234 or meet.example/room"
                      className="mt-2 w-full rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                    <p className="text-sm text-slate-400">Join link</p>
                    <p className="mt-2 text-sm text-slate-200">Enter a code above, then press Join to open the meeting page.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
