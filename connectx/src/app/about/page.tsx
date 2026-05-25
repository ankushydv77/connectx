import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-600 font-semibold mb-4">
            About CONNECTX
          </p>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            Bringing people closer with secure, fast, and beautiful
            communication.
          </h1>
          <p className="text-slate-700 max-w-2xl mx-auto">
            CONNECTX was built to make remote meetings feel natural, polished,
            and easy to access from any device.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="glass border border-indigo-200 rounded-3xl p-10 shadow-xl">
            <h2 className="text-3xl font-semibold mb-5">Our mission</h2>
            <p className="text-slate-700 leading-8 mb-6">
              We empower students and teams to meet, chat, and share content
              without unnecessary setup. CONNECTX blends modern UX with
              practical communication features.
            </p>
            <div className="space-y-4">
              <FeatureRow
                label="Secure sign-in"
                value="Protected user sessions"
              />
              <FeatureRow label="Fast setup" value="Login and join instantly" />
              <FeatureRow
                label="Clear interface"
                value="Designed for focus and flow"
              />
            </div>
          </section>

          <section className="glass border border-indigo-200 rounded-3xl p-10 shadow-xl">
            <h2 className="text-3xl font-semibold mb-5">Why CONNECTX?</h2>
            <p className="text-slate-700 leading-8 mb-6">
              Use CONNECTX as a showcase for your final project or as a
              prototype for a smarter communication toolkit with built-in
              external meeting support.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-full bg-indigo-600 text-white px-6 py-3 font-semibold hover:bg-indigo-700 transition"
            >
              Create your account
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}

function FeatureRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-1 h-3 w-3 rounded-full bg-indigo-500" />
      <div>
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="text-slate-600">{value}</p>
      </div>
    </div>
  );
}
