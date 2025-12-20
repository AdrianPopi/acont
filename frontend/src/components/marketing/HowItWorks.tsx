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
      className="py-16 border-t border-black/10 dark:border-white/10"
    >
      <Container>
        <h2 className="text-2xl md:text-3xl font-semibold">
          {t("sections.howTitle")}
        </h2>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-black/10 dark:border-white/10 p-6"
            >
              <div className="text-sm opacity-70">{s.n}</div>
              <div className="mt-2 font-semibold">{s.title}</div>
              <div className="mt-2 text-sm opacity-80">{s.desc}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
