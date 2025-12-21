"use client";

import Container from "@/components/ui/Container";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

type Tier = {
  name: string;
  price: string;
  badge?: string;
  desc: string;
  features: string[];
};

export default function Pricing() {
  const t = useTranslations();
  const locale = useLocale();
  const raw = t.raw("pricing.tiers");
  const tiers: Tier[] = Array.isArray(raw) ? (raw as Tier[]) : [];

  return (
    <section
      id="pricing"
      className="py-16 border-t border-black/10 dark:border-white/10"
    >
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">
              {t("pricing.title")}
            </h2>
            <p className="mt-2 max-w-2xl opacity-80">{t("pricing.subtitle")}</p>
          </div>
          <div className="text-sm opacity-75">{t("pricing.note")}</div>
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-4">
          {tiers.map((tier) => {
            const featured = tier.badge && tier.badge.length > 0;
            return (
              <div
                key={tier.name}
                className={`rounded-3xl p-[1px] ${featured ? "bg-brand-gradient shadow-glow" : "border border-black/10 dark:border-white/10"}`}
              >
                <div className="rounded-3xl bg-[rgb(var(--card))] p-6 shadow-[var(--shadow)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{tier.name}</div>
                      <div className="mt-2 text-3xl font-semibold tracking-tight">
                        {tier.price}
                      </div>
                      <div className="mt-2 text-sm opacity-80">{tier.desc}</div>
                    </div>
                    {featured ? (
                      <div className="rounded-full bg-brand-gradient px-3 py-1 text-xs font-medium text-black shadow-glow">
                        {tier.badge}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 h-px bg-black/10 dark:bg-white/10" />

                  <ul className="mt-5 space-y-2 text-sm opacity-85">
                    {tier.features.map((f) => (
                      <li key={f} className="flex gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-brand-gradient shadow-glow shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/${locale}/auth/signup`}
                    className={`mt-6 block text-center rounded-2xl px-5 py-3 text-sm font-medium transition ${
                      featured
                        ? "bg-brand-gradient text-black shadow-glow hover:opacity-95"
                        : "border border-black/10 dark:border-white/10 hover:shadow-glow"
                    }`}
                  >
                    {t("pricing.cta")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
