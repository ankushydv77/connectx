"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function MeetPage() {
  const router = useRouter();
  const [room, setRoom] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setRoom(params.get("room") || "");
  }, []);
  const [joined, setJoined] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [message, setMessage] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (joined && cameraOn) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: micOn })
        .then((media) => {
          stream = media;
          if (videoRef.current) {
            videoRef.current.srcObject = media;
            videoRef.current.play().catch(() => null);
          }
        })
        .catch(() => {
          setMessage("Camera access denied or unavailable.");
          setCameraOn(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [joined, cameraOn, micOn]);

  const handleJoin = () => {
    if (!room.trim()) {
      alert("Enter a meeting code or open this page with a room query.");
      return;
    }
    if (!name.trim()) {
      alert("Enter your name to join.");
      return;
    }
    setJoined(true);
    setMessage("Waiting for meeting participants...");
  };

  const handleLeave = () => {
    setJoined(false);
    setMessage("You have left the meeting.");
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      videoRef.current.srcObject = null;
    }
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/meet?room=${encodeURIComponent(room)}`;
    await navigator.clipboard.writeText(url);
    setCopyStatus("Link copied!");
    window.setTimeout(() => setCopyStatus(""), 2000);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 pb-16">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/40">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300 mb-2">
                Meeting room
              </p>
              <h1 className="text-4xl font-semibold tracking-tight">
                {room || "New meeting"}
              </h1>
              <p className="mt-3 text-slate-400 max-w-2xl">
                A simplified Google Meet clone meeting page. Enter your name,
                turn on your camera, and join the room.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-100 hover:bg-white/10 transition"
              >
                Home
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(`/meet-v2?room=${encodeURIComponent(room || "")}`)
                }
                className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm text-cyan-300 hover:bg-cyan-300/20 transition"
              >
                Try New Version
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
              >
                Copy join link
              </button>
            </div>
          </div>

          {!joined && (
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <div className="space-y-6 rounded-[28px] border border-white/10 bg-slate-950/70 p-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Your name
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-4 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCameraOn((current) => !current)}
                    className={`rounded-3xl px-5 py-4 text-sm font-medium transition ${cameraOn ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-200 hover:bg-white/10"}`}
                  >
                    {cameraOn ? "Camera on" : "Camera off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMicOn((current) => !current)}
                    className={`rounded-3xl px-5 py-4 text-sm font-medium transition ${micOn ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-200 hover:bg-white/10"}`}
                  >
                    {micOn ? "Mic on" : "Mic off"}
                  </button>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-3">
                    Meeting details
                  </p>
                  <div className="text-sm text-slate-300 space-y-2">
                    <p>
                      <span className="text-slate-400">Room:</span>{" "}
                      {room || "No code provided"}
                    </p>
                    <p>
                      <span className="text-slate-400">Status:</span> Waiting to
                      join
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleJoin}
                  className="w-full rounded-full bg-white px-6 py-4 text-sm font-semibold text-slate-950 hover:bg-slate-100 transition"
                >
                  Join meeting
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!room.trim()) {
                      alert("Enter a meeting code to open the live call page.");
                      return;
                    }
                    router.push(`/demo?room=${encodeURIComponent(room)}`);
                  }}
                  className="w-full rounded-full border border-cyan-400 bg-cyan-500/10 px-6 py-4 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 transition"
                >
                  Open live call room
                </button>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-4">
                  Preview
                </p>
                <div className="aspect-video overflow-hidden rounded-3xl bg-slate-900">
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover bg-slate-950"
                    muted
                  />
                </div>
                <p className="mt-4 text-sm text-slate-400">
                  Toggle your camera and microphone before joining. Your local
                  preview shows here.
                </p>
              </div>
            </div>
          )}

          {joined && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-4">
                    You are in the meeting
                  </p>
                  <div className="aspect-video overflow-hidden rounded-3xl bg-slate-900">
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover bg-slate-950"
                      muted
                    />
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6">
                  <p className="text-sm uppercase tracking-[0.35em] text-slate-400 mb-4">
                    Meeting controls
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setCameraOn((value) => !value)}
                      className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200 hover:bg-white/10 transition"
                    >
                      {cameraOn ? "Turn camera off" : "Turn camera on"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMicOn((value) => !value)}
                      className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-slate-200 hover:bg-white/10 transition"
                    >
                      {micOn ? "Mute microphone" : "Unmute microphone"}
                    </button>
                    <button
                      type="button"
                      onClick={handleLeave}
                      className="rounded-3xl bg-rose-500 px-5 py-4 text-sm font-semibold text-white hover:bg-rose-400 transition"
                    >
                      Leave meeting
                    </button>
                  </div>
                </div>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-slate-950/80 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Meeting link</p>
                  <p className="mt-2 break-all text-slate-200">{`${window.location.origin}/meet?room=${encodeURIComponent(room)}`}</p>
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition"
                >
                  {copyStatus || "Copy meeting link"}
                </button>
              </div>
              {message && <p className="text-sm text-slate-400">{message}</p>}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
