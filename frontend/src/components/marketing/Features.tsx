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
        <h2 className="text-2xl md:text-3xl font-semibold">
          {t("sections.featuresTitle")}
        </h2>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5 hover:shadow-glow transition"
            >
              <div className="h-10 w-10 rounded-xl bg-brand-gradient shadow-glow" />
              <h3 className="mt-4 font-semibold">{it.title}</h3>
              <p className="mt-2 text-sm opacity-80">{it.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
