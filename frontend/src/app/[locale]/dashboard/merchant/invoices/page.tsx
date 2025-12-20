"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";

type InvoiceRow = {
  id: number;
  invoice_no: string;
  status: string;
  issue_date: string;
  due_date?: string | null;
  client_name: string;
  total_gross: number;
  advance_paid: number;
};

export default function MerchantInvoicesPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const ti = useTranslations("dashboard.invoices");

  const nav = [
    { href: `/${locale}/dashboard/merchant`, label: t("merchant.overview") },
    {
      href: `/${locale}/dashboard/merchant/invoices`,
      label: t("merchant.invoices"),
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

  const [rows, setRows] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) throw new Error("NEXT_PUBLIC_API_URL is missing");

      const res = await fetch(`${base}/invoices`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setRows(JSON.parse(text));
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf(id: number, invoiceNo: string) {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;

    const res = await fetch(`${base}/invoices/${id}/pdf`, {
      credentials: "include",
    });
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${invoiceNo || `invoice-${id}`}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    load();
  }, []);

  const content = useMemo(() => {
    if (loading)
      return <div className="text-sm opacity-70">{ti("loading")}</div>;
    if (err) return <div className="text-sm text-red-500">{err}</div>;
    if (!rows.length)
      return <div className="text-sm opacity-70">{ti("empty")}</div>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="opacity-70">
            <tr className="text-left">
              <th className="py-2">{ti("colNo")}</th>
              <th className="py-2">{ti("colClient")}</th>
              <th className="py-2">{ti("colIssueDate")}</th>
              <th className="py-2">{ti("colTotal")}</th>
              <th className="py-2">{ti("colStatus")}</th>
              <th className="py-2 text-right">{ti("colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-black/10 dark:border-white/10"
              >
                <td className="py-3 font-medium">{r.invoice_no}</td>
                <td className="py-3">{r.client_name}</td>
                <td className="py-3">{r.issue_date}</td>
                <td className="py-3">{r.total_gross.toFixed(2)} EUR</td>
                <td className="py-3">{r.status}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => downloadPdf(r.id, r.invoice_no)}
                      className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {ti("downloadPdf")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [rows, loading, err, ti]);

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{ti("title")}</h1>
        <Link
          href={`/${locale}/dashboard/merchant/invoices/new`}
          className="rounded-2xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium shadow-glow hover:opacity-90"
        >
          {ti("create")}
        </Link>
      </div>

      <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
        {content}
      </div>
    </DashboardShell>
  );
}
