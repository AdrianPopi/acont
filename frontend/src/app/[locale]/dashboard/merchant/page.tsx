"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../_components/merchantNav";

type ClientOut = {
  id: number;
  name: string;
};

type InvoiceRow = {
  id: number;
  invoice_no: string;
  status: string; // draft/issued/paid/void
  issue_date: string; // ISO date
  client_name: string;
  total_gross: number;
};

function parseErrorText(text: string) {
  try {
    const j = JSON.parse(text) as { detail?: string; message?: string };
    return j.detail || j.message || text;
  } catch {
    return text;
  }
}

function money(v: number) {
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
}

function normalizeStatus(s: string) {
  const v = (s || "").toLowerCase();
  if (v === "paid") return "paid";
  if (v === "void") return "void";
  if (v === "draft") return "draft";
  return "unpaid"; // issued -> unpaid
}

function badgeClass(kind: "paid" | "unpaid" | "draft" | "void") {
  switch (kind) {
    case "paid":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50";
    case "unpaid":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50";
    case "draft":
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700";
    case "void":
      return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50";
  }
}

export default function MerchantDashboard() {
  const locale = useLocale();
  const nav = useMerchantNav();

  // folosim DOAR chei existente din JSON
  const tDash = useTranslations("dashboard");
  const tInvoices = useTranslations("dashboard.invoices");

  const base = process.env.NEXT_PUBLIC_API_URL || "/api";

  const [clients, setClients] = useState<ClientOut[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);

    try {
      const [cRes, iRes] = await Promise.all([
        fetch(`${base}/clients/`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${base}/invoices`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const cText = await cRes.text();
      if (!cRes.ok) throw new Error(parseErrorText(cText));

      const iText = await iRes.text();
      if (!iRes.ok) throw new Error(parseErrorText(iText));

      setClients(JSON.parse(cText) as ClientOut[]);
      setInvoices(JSON.parse(iText) as InvoiceRow[]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : tInvoices("loading"));
    } finally {
      setLoading(false);
    }
  }, [base, tInvoices]);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    const totalClients = clients.length;

    const issued = invoices.filter(
      (x) => (x.status || "").toLowerCase() !== "draft"
    ).length;

    const toValidate = invoices.filter(
      (x) => normalizeStatus(x.status) === "unpaid"
    ).length;

    return { totalClients, issued, toValidate };
  }, [clients, invoices]);

  const recent = useMemo(() => invoices.slice(0, 10), [invoices]);

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      {/* Header dengan greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {tDash("merchant.overview")}
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {tInvoices("createSubtitle")}
        </p>
      </div>

      {/* Action buttons */}
      <div className="mb-8 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/dashboard/merchant/invoices/new`}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-1 to-brand-5 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-brand-3/30 hover:shadow-xl hover:shadow-brand-3/40 hover:scale-105 transition-all duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          {tInvoices("create")}
        </Link>

        <Link
          href={`/${locale}/dashboard/merchant/credit-notes/new`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-brand-3/50 dark:hover:border-brand-3/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {tDash("creditNotesNew.title")}
        </Link>

        <Link
          href={`/${locale}/dashboard/merchant/clients`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-brand-3/50 dark:hover:border-brand-3/50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          {tDash("merchant.clients")}
        </Link>
      </div>

      {err && (
        <div className="mb-6 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 px-4 py-3 text-sm text-rose-700 dark:text-rose-400 flex items-start gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {err}
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <KpiCard
          title={tDash("merchant.kpiClients")}
          value={String(kpis.totalClients)}
          icon="👥"
          gradient="from-blue-500/20 via-blue-600/20 to-blue-700/20"
          borderColor="border-blue-200 dark:border-blue-800/50"
        />
        <KpiCard
          title={tDash("merchant.kpiIssuedInvoices")}
          value={String(kpis.issued)}
          icon="📄"
          gradient="from-emerald-500/20 via-emerald-600/20 to-emerald-700/20"
          borderColor="border-emerald-200 dark:border-emerald-800/50"
        />
        <KpiCard
          title={tDash("merchant.kpiToValidate")}
          value={String(kpis.toValidate)}
          icon="⏳"
          gradient="from-amber-500/20 via-amber-600/20 to-amber-700/20"
          borderColor="border-amber-200 dark:border-amber-800/50"
        />
      </div>

      {/* Recent Invoices */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {tInvoices("title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {tInvoices("createSubtitle")}
              </p>
            </div>

            <Link
              href={`/${locale}/dashboard/merchant/invoices`}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-1/10 to-brand-5/10 dark:from-brand-1/20 dark:to-brand-5/20 border border-brand-3/20 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-brand-3/50 transition-all"
            >
              {tInvoices("title")}
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse"></div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              {tInvoices("loading")}
            </p>
          </div>
        ) : recent.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              {tInvoices("empty")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-200">
                    {tInvoices("colNo")}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-200">
                    {tInvoices("colClient")}
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-slate-200">
                    {tInvoices("colIssueDate")}
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-slate-200">
                    {tInvoices("colTotal")}
                  </th>
                  <th className="px-6 py-3 text-center font-semibold text-slate-900 dark:text-slate-200">
                    {tInvoices("colStatus")}
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-slate-900 dark:text-slate-200">
                    {tInvoices("colActions")}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                {recent.map((r) => {
                  const kind = normalizeStatus(r.status);

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/${locale}/dashboard/merchant/invoices/${r.id}`}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {r.invoice_no}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {r.client_name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {r.issue_date}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-slate-50">
                        €{money(Number(r.total_gross))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${badgeClass(kind)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/${locale}/dashboard/merchant/invoices/${r.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          {tInvoices("colActions")}
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function KpiCard({
  title,
  value,
  icon,
  gradient,
  borderColor,
}: {
  title: string;
  value: string;
  icon?: string;
  gradient?: string;
  borderColor?: string;
}) {
  return (
    <div
      className={`group relative rounded-2xl border ${borderColor || "border-slate-200 dark:border-slate-800"} bg-white dark:bg-slate-900 p-6 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-3/10 dark:hover:shadow-brand-3/5 hover:border-brand-3/30`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-1/5 to-brand-5/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {title}
            </p>
            <p className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
          </div>
          {icon && (
            <div className="text-4xl opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
              {icon}
            </div>
          )}
        </div>

        {/* Progress bar with brand gradient */}
        <div className="mt-5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-1 to-brand-5 rounded-full"
            style={{ width: `${Math.min(100, (parseInt(value) || 0) * 15)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
