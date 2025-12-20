"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useLocale, useTranslations } from "next-intl";

export default function MerchantDashboard() {
  const locale = useLocale();
  const t = useTranslations("dashboard");

  const nav = [
    { href: `/${locale}/dashboard/merchant`, label: t("merchant.overview") },
    {
      href: `/${locale}/dashboard/merchant/invoices`,
      label: t("merchant.invoices"),
    },
    {
      href: `/${locale}/dashboard/merchant/credit-notes`,
      label: t("merchant.creditNotes"),
    },
    {
      href: `/${locale}/dashboard/merchant/clients`,
      label: t("merchant.clients"),
    },
    {
      href: `/${locale}/dashboard/merchant/products`,
      label: t("merchant.products"),
    },
    {
      href: `/${locale}/dashboard/merchant/deviz`,
      label: t("merchant.deviz"),
    },
    {
      href: `/${locale}/dashboard/merchant/reports`,
      label: t("merchant.reports"),
    },
    {
      href: `/${locale}/dashboard/merchant/settings`,
      label: t("merchant.settings"),
    },
  ];

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="grid gap-4 lg:grid-cols-3">
        <KpiCard title={t("merchant.kpiClients")} value="0" />
        <KpiCard title={t("merchant.kpiIssuedInvoices")} value="0" />
        <KpiCard title={t("merchant.kpiToValidate")} value="0" />
      </div>

      <div className="mt-6 rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("merchant.overview")}</h2>
        </div>

        <div className="mt-3 text-sm opacity-80">
          {/* placeholder text */}
          “Create invoice / Upload expense / Recent activity”
        </div>
      </div>
    </DashboardShell>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
      <div className="text-sm opacity-70">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
