"use client";

import Container from "@/components/ui/Container";
import { useTranslations } from "next-intl";

export default function CTA() {
  const t = useTranslations();

  return (
    <section className="py-16">
      <Container>
        <div className="rounded-3xl bg-brand-gradient p-[1px] shadow-glow">
          <div className="rounded-3xl bg-[rgb(var(--bg))] p-6 sm:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold">
                {t("sections.ctaTitle")}
              </h3>
              <p className="mt-2 opacity-80">{t("cta.subtitle")}</p>
            </div>

            <a
              href="#"
              className="w-full md:w-auto text-center rounded-2xl bg-brand-gradient px-6 py-3 text-black font-medium shadow-glow hover:opacity-95 transition"
            >
              {t("hero.ctaPrimary")}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
