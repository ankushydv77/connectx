"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Video, Keyboard, Sparkles, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home() {
  const [meetingCode, setMeetingCode] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setCurrentUser(getCurrentUser());

    // Auto-slide carousel
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const createMeeting = () => {
    const randomId =
      `${Math.random().toString(36).substring(2, 8)}-${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
    router.push(`/meet-v2?room=${randomId}`);
  };

  const joinMeeting = () => {
    const code = meetingCode.trim();
    if (!code) return;
    
    // Extract room ID if link was entered
    const roomCode = code.includes("room=") ? code.split("room=")[1] : (code.includes("/") ? code.substring(code.lastIndexOf("/") + 1) : code);
    router.push(`/meet-v2?room=${encodeURIComponent(roomCode)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && meetingCode.trim()) {
      joinMeeting();
    }
  };

  const carouselSlides = [
    {
      title: "Get a link you can share",
      description: "Click New meeting to get a link you can send to people you want to meet with.",
      badge: "Fast & Secure",
    },
    {
      title: "Direct P2P File Sharing",
      description: "Securely send documents, slide decks, and images directly during your call.",
      badge: "Premium Tier",
    },
    {
      title: "Live Speech Translation",
      description: "Break down language barriers with real-time AI speech-to-text translation captions.",
      badge: "AI Powered",
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-800 flex flex-col justify-between">
      <section className="relative overflow-hidden flex-1 flex items-center py-16 lg:py-24">
        {/* Sleek background radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.1),_transparent_28%)]" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute top-1/3 left-10 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Content Column */}
            <div className="space-y-8 max-w-2xl">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-700 tracking-wide uppercase shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  CONNECTX Engine v2
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-slate-900">
                  Premium video meetings.<br />Now free for everyone.
                </h1>
                <p className="text-slate-650 text-lg sm:text-xl leading-relaxed max-w-lg font-medium">
                  We re-engineered real-time conferencing. Start or join instant meetings, share files, and translate dialogue live.
                </p>
              </div>

              {/* Dynamic Authentication/Tier Banner */}
              {currentUser ? (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-sm font-semibold text-cyan-800 w-fit shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Logged in as <span className="font-bold text-slate-900">{currentUser.name}</span>. Premium direct file sharing & AI speech translation are unlocked!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-500 w-fit">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Guest Mode. Sign in or register to unlock high-speed P2P file transfers and live caption translations.</span>
                </div>
              )}

              {/* Signature ConnectX Styled Input & Button row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                {/* New Meeting Button */}
                <button
                  onClick={createMeeting}
                  className="rounded-lg bg-cyan-600 text-white font-bold px-6 py-3.5 hover:bg-cyan-700 transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 duration-200 active:scale-95 cursor-pointer"
                >
                  <Video className="w-5 h-5 flex-shrink-0" />
                  <span>New meeting</span>
                </button>

                {/* Go to Dashboard Button */}
                <button
                  onClick={() => router.push("/dashboard")}
                  className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold px-6 py-3.5 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg duration-200 active:scale-95 cursor-pointer"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-cyan-600" />
                </button>

                {/* Join Code Input */}
                <div className="flex items-center bg-white border border-slate-250/80 rounded-lg px-3.5 py-2.5 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/10 transition duration-200 flex-1 max-w-sm shadow-sm">
                  <Keyboard className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    value={meetingCode}
                    onChange={(e) => setMeetingCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter a code or link"
                    className="bg-transparent text-slate-800 text-sm outline-none w-full placeholder-slate-400 font-semibold"
                  />
                  <button
                    onClick={joinMeeting}
                    disabled={!meetingCode.trim()}
                    className="text-sm font-bold text-cyan-600 disabled:text-slate-350 hover:text-cyan-700 disabled:cursor-not-allowed transition ml-3 flex-shrink-0 duration-200 cursor-pointer"
                  >
                    Join
                  </button>
                </div>
              </div>

              {/* Divider and Subtext */}
              <div className="border-t border-slate-200 pt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-cyan-600" />
                  <span>Learn more about security and end-to-end P2P signaling in CONNECTX.</span>
                </div>
              </div>
            </div>

            {/* Right Illustration Carousel Column */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white/80 p-6 backdrop-blur-xl shadow-2xl relative">
                {/* Mockup screen overlay */}
                <div className="aspect-square bg-slate-100/50 border border-slate-200 shadow-inner rounded-2xl overflow-hidden flex flex-col justify-between p-6 relative group">
                  {/* Floating mesh shape */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.06),_transparent_60%)]" />

                  {/* Simulated participants layout */}
                  <div className="grid grid-cols-2 gap-3 relative z-10 flex-1 items-center">
                    {/* Simulated card 1 */}
                    <div className="aspect-[4/3] rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 flex items-center justify-center font-bold text-xs">A</div>
                      <div className="absolute bottom-1.5 left-1.5 bg-white/90 border border-slate-200/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-[8px] font-bold text-slate-700 truncate max-w-[80px] shadow-sm">Alex (You)</div>
                    </div>
                    {/* Simulated card 2 */}
                    <div className="aspect-[4/3] rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center relative overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center font-bold text-xs">J</div>
                      <div className="absolute bottom-1.5 left-1.5 bg-white/90 border border-slate-200/50 backdrop-blur-sm rounded-full px-2 py-0.5 text-[8px] font-bold text-slate-700 truncate max-w-[80px] shadow-sm">Jessica</div>
                    </div>
                  </div>

                  {/* Text Slide Carousel */}
                  <div className="text-center space-y-2 mt-6 relative z-10">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-cyan-600 border border-slate-200 shadow-sm">
                      {carouselSlides[activeSlide].badge}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-800 transition duration-300">
                      {carouselSlides[activeSlide].title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-sm mx-auto min-h-10 transition duration-300">
                      {carouselSlides[activeSlide].description}
                    </p>

                    {/* Dots indicators */}
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                      {carouselSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveSlide(i)}
                          className={`w-1.5 h-1.5 rounded-full transition duration-350 ${
                            activeSlide === i ? "bg-cyan-600 w-3" : "bg-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid of features in footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-sm py-12 shadow-inner">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Live Translation",
                description: "Watch subtitles translate audio dynamically into matching locale captions.",
              },
              {
                title: "Virtual Backgrounds",
                description: "Real-time CDN body segmenter providing high-speed blurs and presets.",
              },
              {
                title: "Direct P2P Sharing",
                description: "Send full document assets instantly inside call tracks via RTC data channels.",
              },
              {
                title: "Chronological Hand Raises",
                description: "Signal speakers and track queue orders with glowing badges across grid panels.",
              },
            ].map((feat) => (
              <div
                key={feat.title}
                className="rounded-2xl border border-slate-200/85 bg-white p-5 text-sm space-y-2 hover:border-cyan-500/30 transition duration-350 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                  {feat.title}
                </p>
                <p className="text-slate-500 font-semibold text-xs leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
