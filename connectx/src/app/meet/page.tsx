"use client";

import { useState } from "react";
import Link from "next/link";

export default function MeetPage() {
  const [meetingCode, setMeetingCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const openZoom = () => {
    if (!meetingCode) {
      alert("Enter a Zoom meeting ID or full link to continue.");
      return;
    }
    const url = meetingCode.startsWith("http")
      ? meetingCode
      : `https://zoom.us/j/${meetingCode}`;
    window.open(url, "_blank");
  };

  const openGoogleMeet = () => {
    if (!meetingCode) {
      alert("Enter a Google Meet code or link to continue.");
      return;
    }
    const code = meetingCode.includes("meet.google.com")
      ? meetingCode
      : `https://meet.google.com/${meetingCode}`;
    window.open(code, "_blank");
  };

  const generateCode = () => {
    const code = Array.from({ length: 10 }, () =>
      Math.random().toString(36).charAt(2),
    ).join("");
    setGeneratedCode(code.toUpperCase());
    setMeetingCode(code);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-600 font-semibold mb-4">
            Meeting tools
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Launch a Zoom or Google Meet session with one click.
          </h1>
          <p className="text-slate-700 max-w-2xl mx-auto">
            Use CONNECTX as your meeting hub. Enter a code, paste a link, or
            generate a quick meeting reference to share with your team.
          </p>
        </div>

        <section className="glass border border-indigo-200 rounded-3xl p-10 shadow-xl mb-10">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Join external meetings
              </h2>
              <p className="text-slate-700 leading-7 mb-6">
                Paste a Zoom meeting ID or Google Meet code and open the session
                in a new tab. CONNECTX helps you keep meeting links organized
                alongside your chat and profile.
              </p>
              <label className="block text-sm font-medium text-slate-900 mb-3">
                Meeting code or URL
              </label>
              <input
                value={meetingCode}
                onChange={(event) => setMeetingCode(event.target.value)}
                placeholder="e.g. 1234567890 or abc-defg-hij"
                className="w-full rounded-3xl border border-slate-300 px-5 py-4 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={openZoom}
                  className="rounded-full bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition"
                >
                  Open Zoom
                </button>
                <button
                  onClick={openGoogleMeet}
                  className="rounded-full bg-cyan-600 px-6 py-3 text-white font-semibold hover:bg-cyan-700 transition"
                >
                  Open Google Meet
                </button>
              </div>
            </div>
            <div className="rounded-3xl bg-indigo-600/10 p-6">
              <h3 className="text-xl font-semibold mb-4">
                Quick meeting helper
              </h3>
              <p className="text-slate-700 leading-7 mb-6">
                Generate a simple join code in seconds, then copy it to share
                with your participants. Perfect for quick meetups and remote
                classes.
              </p>
              <div className="mb-6 rounded-3xl bg-white p-4 border border-slate-200">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-500 mb-2">
                  Generated code
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {generatedCode || "-"}
                </p>
              </div>
              <button
                onClick={generateCode}
                className="rounded-full border border-indigo-500 px-6 py-3 bg-white text-slate-900 font-semibold hover:bg-indigo-50 transition"
              >
                Generate meeting code
              </button>
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="glass border border-indigo-200 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">
              In-app video experience
            </h2>
            <p className="text-slate-700 leading-7 mb-6">
              Want a built-in call instead? Use the native CONNECTX video call
              tool to connect directly with your camera and microphone.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white px-6 py-3 font-semibold hover:bg-slate-800 transition"
            >
              Start in-app call
            </Link>
          </div>

          <div className="glass border border-indigo-200 rounded-3xl p-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-4">
              Meeting notes & invite
            </h2>
            <p className="text-slate-700 leading-7 mb-6">
              Copy the generated meeting code or paste an existing link so your
              guests can join quickly from any browser.
            </p>
            <div className="rounded-3xl bg-white p-6 border border-slate-200">
              <p className="text-sm text-slate-500 mb-2">
                Meeting link preview
              </p>
              <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 text-slate-700">
                {meetingCode
                  ? meetingCode
                  : "Enter a link or code above and choose Zoom or Meet."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
