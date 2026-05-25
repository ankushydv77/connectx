import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-slate-50 to-slate-100 text-slate-900 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-600 font-semibold mb-4">
            How it works
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            A simple workflow for every meeting and chat session.
          </h1>
          <p className="text-slate-700 max-w-2xl mx-auto">
            CONNECTX gives you clear steps from signup to live collaboration so
            teams stay connected without friction.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Create Account",
              description:
                "Register with name, email, and phone to get a personalized profile.",
            },
            {
              step: "2",
              title: "Join Chat or Meeting",
              description:
                "Log in and launch a chat room or start a video call instantly.",
            },
            {
              step: "3",
              title: "Use External Meeting Links",
              description:
                "Open Zoom and Google Meet sessions directly from CONNECTX.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="glass border border-indigo-200 rounded-3xl p-8 shadow-xl"
            >
              <span className="text-indigo-700 font-bold text-sm uppercase tracking-[0.35em]">
                Step {item.step}
              </span>
              <h2 className="text-3xl font-semibold mt-4 mb-4 text-slate-900">
                {item.title}
              </h2>
              <p className="text-slate-700 leading-7">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <div className="glass border border-indigo-200 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">
              Meetings from anywhere
            </h2>
            <p className="text-slate-700 leading-7 mb-6">
              Create or join a meeting from the dashboard, then invite your team
              using a code or direct link to Zoom or Google Meet.
            </p>
            <Link
              href="/meet"
              className="inline-flex items-center justify-center rounded-full bg-cyan-600 text-white px-6 py-3 font-semibold hover:bg-cyan-700 transition"
            >
              Open Meeting Tools
            </Link>
          </div>

          <div className="glass border border-indigo-200 rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">
              Video call readiness
            </h2>
            <p className="text-slate-700 leading-7 mb-6">
              Use your camera and microphone in a single click, then share your
              meeting code with others to connect instantly.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:border-cyan-500 hover:text-cyan-600 transition"
            >
              Start In-App Video Call
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
