"use client";

import { useState } from "react";
import Container from "@/components/ui/Container";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";

export default function Pricing() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      key: "starter",
      name: t("plans.starter.name"),
      priceMonthly: 15,
      priceYearly: 150,
      monthlyEquivalent: 12.5, // 150/12
      features: [
        t("plans.starter.features.invoices"),
        t("plans.starter.features.extra"),
        t("plans.starter.features.pdf"),
        t("plans.starter.features.support"),
      ],
    },
    {
      key: "pro",
      name: t("plans.pro.name"),
      priceMonthly: 30,
      priceYearly: 320,
      monthlyEquivalent: 26.67, // 320/12
      badge: t("popular"),
      features: [
        t("plans.pro.features.invoices"),
        t("plans.pro.features.extra"),
        t("plans.pro.features.pdf"),
        t("plans.pro.features.support"),
        t("plans.pro.features.peppol"),
      ],
    },
    {
      key: "enterprise",
      name: t("plans.enterprise.name"),
      priceMonthly: 120,
      priceYearly: 1400,
      monthlyEquivalent: 116.67, // 1400/12
      features: [
        t("plans.enterprise.features.invoices"),
        t("plans.enterprise.features.extra"),
        t("plans.enterprise.features.pdf"),
        t("plans.enterprise.features.support"),
        t("plans.enterprise.features.peppol"),
        t("plans.enterprise.features.api"),
        t("plans.enterprise.features.manager"),
      ],
    },
  ];

  return (
    <section
      id="pricing"
      className="py-16 border-t border-black/10 dark:border-white/10"
    >
      <Container>
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">{t("title")}</h2>
          <p className="mt-2 max-w-2xl mx-auto opacity-80">{t("subtitle")}</p>

          {/* Free trial badge */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-900/30 px-4 py-2 text-sm text-green-700 dark:text-green-400">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t("trialBadge")}
          </div>
        </div>

        {/* Billing toggle */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span
            className={`text-sm font-medium ${!isYearly ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
          >
            {t("monthly")}
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              isYearly ? "bg-brand-gradient" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                isYearly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium ${isYearly ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
          >
            {t("yearly")}
          </span>
          {isYearly && (
            <span className="rounded-full bg-brand-gradient px-2 py-0.5 text-xs font-medium text-black">
              {t("savePercent")}
            </span>
          )}
        </div>

        <div className="mt-8 grid lg:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const featured = plan.badge && plan.badge.length > 0;
            const price = isYearly ? plan.priceYearly : plan.priceMonthly;
            const displayPrice = isYearly
              ? plan.monthlyEquivalent.toFixed(2)
              : plan.priceMonthly;

            return (
              <div
                key={plan.key}
                className={`rounded-3xl p-[1px] ${featured ? "bg-brand-gradient shadow-glow" : "border border-black/10 dark:border-white/10"}`}
              >
                <div className="rounded-3xl bg-[rgb(var(--card))] p-6 shadow-[var(--shadow)] h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        {plan.name}
                      </div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                          €{displayPrice}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          /{t("perMonth")}
                        </span>
                      </div>
                      {isYearly && (
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          €{price} {t("billedYearly")}
                        </div>
                      )}
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {t("vatIncluded")}
                      </div>
                    </div>
                    {featured ? (
                      <div className="rounded-full bg-brand-gradient px-3 py-1 text-xs font-medium text-black shadow-glow">
                        {plan.badge}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-5 h-px bg-black/10 dark:bg-white/10" />

                  <ul className="mt-5 space-y-3 text-sm flex-1">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex gap-3">
                        <svg
                          className="h-5 w-5 flex-shrink-0 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-600 dark:text-gray-300">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/${locale}/auth/signup`}
                    className={`mt-6 block text-center rounded-2xl px-5 py-3 text-sm font-medium transition ${
                      featured
                        ? "bg-brand-gradient text-black shadow-glow hover:opacity-95"
                        : "border border-black/10 dark:border-white/10 hover:shadow-glow hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {t("cta")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("note")}
        </p>
      </Container>
    </section>
  );
}
