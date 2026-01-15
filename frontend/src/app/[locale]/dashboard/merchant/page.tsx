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
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "unpaid":
      return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20";
    case "draft":
      return "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20";
    case "void":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/20";
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
      {/* Header identic ca la clienți */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {tDash("merchant.overview")}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/dashboard/merchant/invoices/new`}
            className="rounded-2xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium shadow-glow hover:opacity-90"
          >
            {tInvoices("create")}
          </Link>

          <Link
            href={`/${locale}/dashboard/merchant/credit-notes/new`}
            className="rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            {tDash("creditNotesNew.title")}
          </Link>

          <Link
            href={`/${locale}/dashboard/merchant/clients`}
            className="rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            {tDash("merchant.clients")}
          </Link>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {err}
        </div>
      )}

      {/* KPI – folosim DOAR chei existente: dashboard.merchant.kpi* */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <KpiCard
          title={tDash("merchant.kpiClients")}
          value={String(kpis.totalClients)}
        />
        <KpiCard
          title={tDash("merchant.kpiIssuedInvoices")}
          value={String(kpis.issued)}
        />
        <KpiCard
          title={tDash("merchant.kpiToValidate")}
          value={String(kpis.toValidate)}
        />
      </div>

      {/* Tabel facturi recente – folosim DOAR cheile existente din dashboard.invoices */}
      <div className="mt-6 rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{tInvoices("title")}</h2>
            <div className="mt-1 text-xs opacity-60">
              {tInvoices("createSubtitle")}
            </div>
          </div>

          <Link
            href={`/${locale}/dashboard/merchant/invoices`}
            className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            {tInvoices("title")}
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 text-sm opacity-70">{tInvoices("loading")}</div>
        ) : recent.length === 0 ? (
          <div className="mt-4 text-sm opacity-70">{tInvoices("empty")}</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="opacity-70">
                <tr className="text-left">
                  <th className="py-2">{tInvoices("colNo")}</th>
                  <th className="py-2">{tInvoices("colClient")}</th>
                  <th className="py-2">{tInvoices("colIssueDate")}</th>
                  <th className="py-2">{tInvoices("colTotal")}</th>
                  <th className="py-2">{tInvoices("colStatus")}</th>
                  <th className="py-2 text-right">{tInvoices("colActions")}</th>
                </tr>
              </thead>

              <tbody>
                {recent.map((r) => {
                  const kind = normalizeStatus(r.status);

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
                    >
                      <td className="py-3 font-medium">
                        <Link
                          href={`/${locale}/dashboard/merchant/invoices/${r.id}`}
                          className="hover:underline"
                        >
                          {r.invoice_no}
                        </Link>
                      </td>
                      <td className="py-3">{r.client_name}</td>
                      <td className="py-3">{r.issue_date}</td>
                      <td className="py-3">
                        {money(Number(r.total_gross))} EUR
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${badgeClass(kind)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end">
                          <Link
                            href={`/${locale}/dashboard/merchant/invoices/${r.id}`}
                            className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                          >
                            {tInvoices("colActions")}
                          </Link>
                        </div>
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

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
      <div className="text-sm opacity-70">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}
