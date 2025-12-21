"use client";

import Container from "@/components/ui/Container";
import { useTranslations } from "next-intl";

type Block = { title: string; items: string[] };

export default function Compliance() {
  const t = useTranslations();
  const raw = t.raw("compliance.blocks");
  const blocks: Block[] = Array.isArray(raw) ? (raw as Block[]) : [];

  return (
    <section
      id="compliance"
      className="relative overflow-hidden py-16 border-t border-black/10 dark:border-white/10"
    >
      {/* Decorative background (premium blobs) */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-gradient blur-3xl opacity-20 float-slow" />
        <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-brand-gradient blur-3xl opacity-15 float-slower" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
      </div>

      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="reveal">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
              {t("compliance.title")}
            </h2>
            <p className="mt-2 max-w-2xl opacity-80">
              {t("compliance.subtitle")}
            </p>

            {/* small badges row (optional, no new i18n keys) */}
            <div className="mt-4 flex flex-wrap gap-2">
              {["Peppol", "EN 16931", "2026", "B2B"].map((x) => (
                <span
                  key={x}
                  className="text-xs rounded-full border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-1 opacity-90"
                >
                  {x}
                </span>
              ))}
            </div>
          </div>

          <a
            href="#pricing"
            className="reveal inline-flex items-center justify-center rounded-2xl border border-black/10 dark:border-white/10 px-5 py-3 text-sm hover:shadow-glow transition
                       bg-[rgb(var(--bg))]/70 backdrop-blur"
            style={{ animationDelay: "80ms" }}
          >
            {t("compliance.cta")}
          </a>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {blocks.map((b, i) => (
            <div
              key={b.title}
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

              {/* Shimmer */}
              <div
                aria-hidden
                className="pointer-events-none absolute -left-1/2 top-0 h-full w-1/2 opacity-0 group-hover:opacity-100"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
                  animation: "shimmer 1.4s ease-out",
                }}
              />

              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-brand-gradient shadow-glow" />
                <div className="h-px flex-1 bg-gradient-to-r from-black/10 to-transparent dark:from-white/10" />
              </div>

              <h3 className="mt-4 font-semibold tracking-tight">{b.title}</h3>

              <ul className="mt-3 space-y-2 text-sm opacity-85">
                {b.items.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-gradient shadow-glow shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              {/* bottom accent */}
              <div className="mt-5 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent dark:via-white/10" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
