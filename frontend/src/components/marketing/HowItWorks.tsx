"use client";

import Container from "@/components/ui/Container";
import { useTranslations } from "next-intl";

type Step = { n: string; title: string; desc: string };

export default function HowItWorks() {
  const t = useTranslations();
  const raw = t.raw("how.steps");
  const steps: Step[] = Array.isArray(raw) ? (raw as Step[]) : [];

  return (
    <section
      id="how"
      className="relative overflow-hidden py-16 border-t border-black/10 dark:border-white/10"
    >
      {/* Decorative background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 -left-24 h-72 w-72 rounded-full bg-brand-gradient blur-3xl opacity-15 float-slower" />
        <div className="absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-brand-gradient blur-3xl opacity-12 float-slow" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
      </div>

      <Container>
        <div className="reveal">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {t("sections.howTitle")}
          </h2>
          <p className="mt-2 max-w-2xl opacity-80">
            {t("sections.howSubtitle")}
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className="reveal group relative overflow-hidden rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-6
                         shadow-[var(--shadow)] hover:shadow-[var(--shadow-strong)] transition
                         hover:-translate-y-0.5"
              style={{ animationDelay: `${120 + i * 80}ms` }}
            >
              {/* Glow ring */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                style={{
                  boxShadow:
                    "inset 0 0 0 1px rgba(43,245,231,0.18), 0 18px 60px rgba(43,245,231,0.10)",
                }}
              />

              {/* top row */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs opacity-70">{s.n}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-gradient shadow-glow" />
                </div>

                <div className="h-9 w-9 rounded-2xl border border-black/10 dark:border-white/10 bg-[rgb(var(--bg))]/60 backdrop-blur flex items-center justify-center">
                  <div className="h-3.5 w-3.5 rounded-lg bg-brand-gradient shadow-glow" />
                </div>
              </div>

              <div className="mt-4 font-semibold tracking-tight">{s.title}</div>
              <div className="mt-2 text-sm opacity-80">{s.desc}</div>

              <div className="mt-5 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
