"use client";

import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))]/70 backdrop-blur p-4 hover-glow motion-safe:smooth">
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="text-sm opacity-70 mt-1">{label}</div>
    </div>
  );
}

export default function Hero() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden noise">
      <div className="aurora" />
      <div className="absolute inset-0 grid-soft opacity-[0.35] dark:opacity-[0.25]" />

      {/* OPTIONAL VIDEO (pui tu public/hero.mp4). Dacă nu există, rămâne doar aurora. */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.12] dark:opacity-[0.10]">
        <video
          className="h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>

      <Container>
        <div className="py-14 sm:py-18 md:py-24">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-[rgb(var(--card))]/70 px-4 py-2 text-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand-gradient shadow-glow" />
              Belgium • Peppol • EN 16931 • 2026 Ready
            </p>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="mt-5 text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
              {t("hero.title")}
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="mt-5 max-w-2xl text-base md:text-lg opacity-80">
              {t("hero.subtitle")}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#pricing"
                className="w-full sm:w-auto text-center rounded-2xl bg-brand-gradient px-6 py-3 text-black font-medium shadow-glow hover:opacity-95 transition"
              >
                {t("hero.ctaPrimary")}
              </a>
              <a
                href="#how"
                className="w-full sm:w-auto text-center rounded-2xl border border-black/10 dark:border-white/10 px-6 py-3 hover:shadow-glow transition"
              >
                {t("hero.ctaSecondary")}
              </a>
            </div>
          </Reveal>

          {/* “Stagger” cards */}
          <motion.div
            className="mt-10 grid gap-3 md:grid-cols-3"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {[
              { label: "Conformitate legală", value: "2026" },
              { label: "Transport securizat", value: "Peppol" },
              { label: "Format structurat", value: "EN 16931" },
            ].map((s) => (
              <motion.div
                key={s.label}
                variants={{
                  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
                  show: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                <Stat label={s.label} value={s.value} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
