import Link from "next/link";

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-600 font-semibold mb-4">
            Features
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Build meetings, chat, and collaboration with one elegant platform.
          </h1>
          <p className="text-slate-700 max-w-2xl mx-auto">
            Explore the full CONNECTX feature set with dedicated pages designed
            for productivity, secure communication, and easy team meetings.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {[
            {
              title: "HD Video Calling",
              description:
                "Trusted video call experience with peer-to-peer quality and media sharing.",
              badge: "Zoom-style meetings",
            },
            {
              title: "Instant Messaging",
              description:
                "Real-time chat with file sharing, notifications, and secure sessions.",
              badge: "Live conversation",
            },
            {
              title: "Google Meet Support",
              description:
                "Open external meetings seamlessly with Google Meet links and codes.",
              badge: "External meeting links",
            },
            {
              title: "Persistent Profiles",
              description:
                "Save your name, email, phone, and avatar for fast logins and profile control.",
              badge: "Professional UI",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="glass border border-indigo-200 p-8 rounded-3xl shadow-lg transition hover:-translate-y-1"
            >
              <span className="inline-flex rounded-full bg-indigo-100 text-indigo-700 px-3 py-1 text-xs font-semibold mb-4">
                {feature.badge}
              </span>
              <h2 className="text-2xl font-bold mb-3">{feature.title}</h2>
              <p className="text-slate-700 leading-7">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          <section className="glass border border-indigo-200 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              Designed for modern teams
            </h3>
            <p className="text-slate-700 leading-7 mb-6">
              CONNECTX combines instant messaging and live calls with a polished
              experience that feels modern and fast on desktop or mobile.
            </p>
            <Link
              href="/meet"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 text-white px-6 py-3 font-semibold hover:bg-indigo-700 transition"
            >
              Try Meeting Tools
            </Link>
          </section>

          <section className="glass border border-indigo-200 rounded-3xl p-8 shadow-xl">
            <h3 className="text-2xl font-semibold mb-4">
              Ready for production
            </h3>
            <p className="text-slate-700 leading-7 mb-6">
              Use CONNECTX for project demos, team syncs, or to explore new
              communication workflows with integrated chat and video.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 font-semibold text-slate-900 hover:border-indigo-500 hover:text-indigo-600 transition"
            >
              Visit Dashboard
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
