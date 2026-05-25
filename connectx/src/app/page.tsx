"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Video,
  Globe2,
  FileText,
  ShieldCheck,
  ArrowRight,
  Zap,
  Mic,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartChat = () => {
    const user =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!user) {
      alert("Please login to start chatting.");
      router.push("/login");
      return;
    }
    router.push("/chat");
  };

  const handleStartVideo = () => {
    const user =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!user) {
      alert("Please login to start video calling.");
      router.push("/login");
      return;
    }
    router.push("/demo");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 text-slate-900 selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed w-full z-50 glass border-b-0 border-indigo-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/25 text-white">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-indigo-600">
              CONNECTX
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-700">
            <Link
              href="/features"
              className="hover:text-indigo-600 transition-colors font-medium"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="hover:text-indigo-600 transition-colors font-medium"
            >
              How it works
            </Link>
            <Link
              href="/about"
              className="hover:text-indigo-600 transition-colors font-medium"
            >
              About
            </Link>
            <Link
              href="/meet"
              className="hover:text-indigo-600 transition-colors font-medium"
            >
              Meet
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-indigo-200 transition-all transform hover:scale-105 active:scale-95"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mt-20 mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-indigo-200 mb-8 text-indigo-600 text-sm font-medium"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              Next-Gen Communication Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-8 text-slate-900"
            >
              Connect with the world in{" "}
              <span className="text-gradient">real-time</span> seamlessly.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-700 max-w-2xl mb-12"
            >
              Experience crystal-clear video calls, instant messaging, and
              AI-powered real-time translation all in one powerful platform.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button
                onClick={handleStartChat}
                className="px-8 py-4 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-medium hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 group"
              >
                Start Chatting
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={handleStartVideo}
                className="px-8 py-4 rounded-full glass border-indigo-200 hover:bg-white/60 transition-all font-medium flex items-center justify-center gap-2 text-slate-900"
              >
                <Video className="w-5 h-5" />
                Try Video Call
              </button>
              <Link
                href="/meet"
                className="px-8 py-4 rounded-full bg-slate-900 text-white font-medium hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                Meet Hub
              </Link>
            </motion.div>
          </div>

          {/* Dashboard Preview / Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mx-auto max-w-5xl rounded-2xl glass p-2 overflow-hidden shadow-2xl border-indigo-200"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5" />
            <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl aspect-[16/9] flex items-center justify-center">
              {/* Fake UI mockup */}
              <div className="w-full h-full flex">
                <div className="w-64 border-r border-slate-800 p-4 flex flex-col gap-4">
                  <div className="w-full h-10 rounded-lg bg-white/5" />
                  <div className="w-full h-10 rounded-lg bg-white/5" />
                  <div className="w-full h-10 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center px-3 gap-2">
                    <MessageSquare className="w-4 h-4" /> General
                  </div>
                  <div className="w-full h-10 rounded-lg bg-white/5" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="h-16 border-b border-slate-800 flex items-center px-6 justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/20" />
                      <div className="w-32 h-4 rounded-full bg-white/10" />
                    </div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                      <div className="w-8 h-8 rounded-lg bg-white/5" />
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex flex-col gap-4">
                    <div className="w-2/3 h-24 rounded-2xl bg-white/5 rounded-tl-none self-start" />
                    <div className="w-1/2 h-16 rounded-2xl bg-indigo-500/20 rounded-tr-none self-end" />
                    <div className="w-3/4 h-20 rounded-2xl bg-white/5 rounded-tl-none self-start" />
                  </div>
                  <div className="h-20 border-t border-slate-800 p-4">
                    <div className="w-full h-full rounded-xl bg-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
              Powerful features for seamless connection
            </h2>
            <p className="text-slate-700 max-w-2xl mx-auto">
              Everything you need to communicate effectively, built into one
              beautiful platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageSquare className="text-indigo-600 w-6 h-6" />}
              title="Real-time Messaging"
              description="Instant text communication using WebSockets for zero-latency conversations."
            />
            <FeatureCard
              icon={<Video className="text-cyan-600 w-6 h-6" />}
              title="HD Video Calling"
              description="Crystal clear peer-to-peer video and audio calls powered by WebRTC."
            />
            <FeatureCard
              icon={<Globe2 className="text-blue-600 w-6 h-6" />}
              title="AI Voice Translation"
              description="Break language barriers with real-time speech-to-text and AI translation."
            />
            <FeatureCard
              icon={<FileText className="text-emerald-600 w-6 h-6" />}
              title="Secure File Sharing"
              description="Share documents, images, and files instantly within your conversations."
            />
            <FeatureCard
              icon={<ShieldCheck className="text-amber-600 w-6 h-6" />}
              title="Enterprise Security"
              description="Robust authentication and secure sessions to keep your data protected."
            />
            <FeatureCard
              icon={<Zap className="text-orange-600 w-6 h-6" />}
              title="Lightning Fast"
              description="Built on Next.js and optimized for maximum performance across all devices."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-slate-900">
            How CONNECTX Works
          </h2>
          <p className="text-slate-700 max-w-2xl mx-auto">
            Login, join a chat, or start a video call — all with one click and
            powered by your profile.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <HowItWorksCard
            title="Secure Sign In"
            description="Register once and sign in to access chat and video features with your saved profile."
          />
          <HowItWorksCard
            title="Start Chatting"
            description="Begin a real-time chat session with your account details shown on the side panel."
          />
          <HowItWorksCard
            title="Video Meeting"
            description="Create or join a meeting using a code or link and start a live video call instantly."
          />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm uppercase tracking-[0.35em] text-indigo-600 font-semibold">
                About CONNECTX
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mt-6 mb-6 text-slate-900">
                A smarter way to connect, chat, and meet online.
              </h2>
              <p className="text-slate-700 leading-8 mb-6">
                CONNECTX brings messaging, video calling, and profile management
                together in one modern interface. Your account stores your name,
                email, phone, and profile picture so you can jump into
                conversations faster.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatCard
                  title="Instant Chat"
                  subtitle="Open messaging after login."
                />
                <StatCard
                  title="Flexible Video"
                  subtitle="Join with code or link."
                />
              </div>
            </div>
            <div className="rounded-3xl bg-white/60 border border-indigo-200 p-8 glass shadow-2xl">
              <h3 className="text-2xl font-semibold mb-4 text-slate-900">
                Ready to build your profile?
              </h3>
              <p className="text-slate-700 mb-6">
                Sign up now and manage your user info from the profile settings
                after login.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    1
                  </div>
                  <p className="text-slate-700">
                    Create your account with name, email, and phone.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold">
                    2
                  </div>
                  <p className="text-slate-700">
                    Login and access chat or video pages securely.
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                    3
                  </div>
                  <p className="text-slate-700">
                    Update your profile and upload a picture anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-indigo-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-bold text-sm text-white">
              C
            </div>
            <span className="font-bold tracking-tight text-slate-900">
              CONNECTX
            </span>
          </div>
          <p className="text-slate-600 text-sm">
            © 2026 CONNECTX Platform. Built for MCA Final Project. 💜 Spreading
            positivity!
          </p>
          <div className="flex gap-4">
            <span className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer text-sm">
              Privacy
            </span>
            <span className="text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer text-sm">
              Terms
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="glass p-8 rounded-2xl hover:bg-white/80 transition-all group border-indigo-200">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-700 leading-relaxed">{description}</p>
    </div>
  );
}

function HowItWorksCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass p-8 rounded-3xl border border-indigo-200 hover:border-indigo-400 transition-all">
      <h3 className="text-xl font-semibold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-700 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="glass rounded-3xl p-6 border border-indigo-200 hover:border-indigo-400 transition-all">
      <h4 className="text-lg font-semibold mb-2 text-slate-900">{title}</h4>
      <p className="text-slate-700 text-sm">{subtitle}</p>
    </div>
  );
}
