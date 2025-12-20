"use client";

import Container from "@/components/ui/Container";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations();

  return (
    <section className="relative overflow-hidden">
      <Container>
        <div className="py-12 sm:py-16 md:py-24">
          <h1 className="mt-4 text-3xl sm:text-4xl md:text-6xl font-semibold tracking-tight">
            {t("hero.title")}
          </h1>

          <p className="mt-4 max-w-xl md:max-w-2xl text-base md:text-lg opacity-80">
            {t("hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="#pricing"
              className="w-full sm:w-auto text-center rounded-2xl bg-brand-gradient px-6 py-3 text-black font-medium"
            >
              {t("hero.ctaPrimary")}
            </a>
            <a
              href="#how"
              className="w-full sm:w-auto text-center rounded-2xl border border-black/10 dark:border-white/10 px-6 py-3"
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
