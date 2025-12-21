"use client";

import Container from "@/components/ui/Container";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

export default function CTA() {
  const t = useTranslations();
  const locale = useLocale();

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

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href={`/${locale}/auth/signup`}
                className="w-full md:w-auto text-center rounded-2xl bg-brand-gradient px-6 py-3 text-black font-medium shadow-glow hover:opacity-95 transition"
              >
                {t("hero.ctaPrimary")}
              </Link>
              <a
                href="#pricing"
                className="w-full md:w-auto text-center rounded-2xl border border-black/10 dark:border-white/10 px-6 py-3 hover:shadow-glow transition"
              >
                {t("cta.secondary")}
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
