"use client";

import Container from "@/components/ui/Container";
import { useTranslations } from "next-intl";

type FeatureItem = { title: string; desc: string };

export default function Features() {
  const t = useTranslations();
  const raw = t.raw("features.items");
  const items: FeatureItem[] = Array.isArray(raw) ? (raw as FeatureItem[]) : [];

  return (
    <section id="features" className="py-16">
      <Container>
        {/* Header + glow blobs (safe) */}
        <div className="relative">
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-brand-gradient opacity-15 blur-3xl" />
          <div className="pointer-events-none absolute -top-8 right-0 h-32 w-32 rounded-full bg-brand-gradient opacity-10 blur-3xl" />

          <h2 className="text-2xl md:text-3xl font-semibold">
            {t("sections.featuresTitle")}
          </h2>
          <p className="mt-2 max-w-2xl opacity-80">
            {t("sections.featuresSubtitle")}
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="
                group relative overflow-hidden
                rounded-3xl border border-black/10 dark:border-white/10
                bg-[rgb(var(--card))] p-6
                shadow-[var(--shadow)] transition
                hover:shadow-[var(--shadow-strong)] hover:-translate-y-0.5
              "
            >
              {/* subtle animated-like layers (no extra CSS) */}
              <div className="pointer-events-none absolute -inset-1 opacity-0 group-hover:opacity-100 transition duration-500">
                <div className="absolute inset-0 rounded-[28px] bg-brand-gradient blur-2xl opacity-15" />
              </div>

              {/* glint sweep */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-700">
                <div
                  className="
                    absolute -inset-x-40 -inset-y-24 rotate-12
                    bg-gradient-to-r from-transparent via-white/10 to-transparent
                    dark:via-white/5
                    translate-x-[-35%] group-hover:translate-x-[35%]
                    transition duration-700
                  "
                />
              </div>

              <div className="relative flex items-center gap-3">
                <div
                  className="
                    h-11 w-11 rounded-2xl bg-brand-gradient shadow-glow
                    transition group-hover:scale-[1.04]
                  "
                />
                <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
              </div>

              <h3 className="relative mt-5 font-semibold text-base">
                {it.title}
              </h3>
              <p className="relative mt-2 text-sm opacity-80">{it.desc}</p>

              <div className="relative mt-5 h-px bg-black/10 dark:bg-white/10" />
              <div className="relative mt-3 text-xs opacity-70 group-hover:opacity-90 transition">
                {t("features.footerHint")}
              </div>

              {/* inner ring highlight */}
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/0 group-hover:ring-white/10 transition" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
