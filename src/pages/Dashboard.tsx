import { Link } from "react-router-dom";
import { FadeIn } from "@/components/fade-in";
import { PipelineMotion } from "@/components/pipeline-motion";

const STEPS = [
  {
    n: "01",
    title: "Create or Trade",
    desc: "Create a market on any crypto, sports, news or weather question, or trade YES/NO on one that already exists.",
  },
  {
    n: "02",
    title: "AI Resolution",
    desc: "At expiry, a GenLayer Intelligent Contract fetches real evidence and runs the same LLM prompt independently across multiple validators, who must agree on the outcome before it's accepted.",
  },
  {
    n: "03",
    title: "Dispute & Arbitrate",
    desc: "A 24-hour window lets anyone file a bonded dispute with new evidence. Arbitration re-runs the same consensus process, weighing both sides, for a final binding outcome.",
  },
];

export default function Dashboard() {
  return (
    <main>
      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-20 md:grid-cols-[1.2fr,1fr] md:py-28">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            &gt; ai-resolved prediction markets on genlayer
          </p>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-ink md:text-5xl">
            Markets settled by evidence, not opinions.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            VeriMarket runs entirely on-chain as a GenLayer Intelligent Contract — real evidence, real LLM
            reasoning, and real multi-validator consensus decide every outcome. No off-chain oracle, no
            centralized backend.
          </p>
          <div className="mt-8 flex items-center gap-6">
            <Link
              to="/markets"
              className="rounded-sm bg-accent px-5 py-2.5 font-mono text-sm text-bg hover:opacity-90"
            >
              Browse Markets
            </Link>
            <Link to="/docs" className="font-mono text-sm text-muted hover:text-ink">
              Read the docs →
            </Link>
          </div>
        </div>
        <FadeIn delay={0.15} className="flex items-center">
          <PipelineMotion />
        </FadeIn>
      </section>

      <section id="pipeline" className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">how it works</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">
              Consensus, not a single API call
            </h2>
          </FadeIn>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <FadeIn key={step.n} delay={i * 0.1}>
                <div className="relative overflow-hidden rounded-sm border border-line bg-surface p-6">
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }}
                  />
                  <span className="font-mono text-xs text-accent">{step.n}</span>
                  <h3 className="mt-2 font-display text-lg font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section id="surfaces" className="border-t border-line">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <FadeIn>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">get started</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-ink">Two ways in</h2>
          </FadeIn>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FadeIn>
              <Link
                to="/markets"
                className="block rounded-sm border border-line bg-surface p-6 transition-colors hover:border-accent"
              >
                <p className="font-mono text-xs uppercase tracking-wide text-muted">browse</p>
                <h3 className="mt-2 font-display text-lg font-bold text-ink">Trade a market</h3>
                <p className="mt-2 text-sm text-muted">
                  Take a YES or NO position on any open market and watch it resolve on real evidence.
                </p>
                <span className="mt-4 inline-block font-mono text-sm text-accent">Browse markets →</span>
              </Link>
            </FadeIn>
            <FadeIn delay={0.1}>
              <Link
                to="/create"
                className="block rounded-sm border border-line bg-surface p-6 transition-colors hover:border-accent"
              >
                <p className="font-mono text-xs uppercase tracking-wide text-muted">create</p>
                <h3 className="mt-2 font-display text-lg font-bold text-ink">Create a market</h3>
                <p className="mt-2 text-sm text-muted">
                  Ask a question with a clean, verifiable resolution source and let the network settle it.
                </p>
                <span className="mt-4 inline-block font-mono text-sm text-accent">Create a market →</span>
              </Link>
            </FadeIn>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 font-mono text-xs text-muted sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} VeriMarket</span>
          <span>Prediction markets, resolved on-chain.</span>
        </div>
      </footer>
    </main>
  );
}
