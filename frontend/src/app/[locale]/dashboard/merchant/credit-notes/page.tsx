"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../_components/merchantNav";

type Row = {
  id: number;
  credit_note_no: string;
  status: string;
  issue_date: string;
  client_name: string;
  invoice_no: string;
  total_gross: number;
};

export default function CreditNotesPage() {
  const locale = useLocale();
  const nav = useMerchantNav();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/credit-notes`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      setRows(JSON.parse(text));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message || "Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  }

  async function downloadPdf(id: number, creditNo: string) {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;

    const res = await fetch(`${base}/credit-notes/${id}/pdf`, {
      credentials: "include",
    });
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${creditNo || `credit-note-${id}`}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    load();
  }, []);

  const content = useMemo(() => {
    if (loading) return <div className="text-sm opacity-70">Loading...</div>;
    if (err) return <div className="text-sm text-red-500">{err}</div>;
    if (!rows.length)
      return <div className="text-sm opacity-70">No credit notes yet.</div>;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="opacity-70">
            <tr className="text-left">
              <th className="py-2">No</th>
              <th className="py-2">Client</th>
              <th className="py-2">Invoice</th>
              <th className="py-2">Issue date</th>
              <th className="py-2">Total</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-black/10 dark:border-white/10"
              >
                <td className="py-3 font-medium">{r.credit_note_no}</td>
                <td className="py-3">{r.client_name}</td>
                <td className="py-3">{r.invoice_no}</td>
                <td className="py-3">{r.issue_date}</td>
                <td className="py-3">{Number(r.total_gross).toFixed(2)} EUR</td>
                <td className="py-3">{r.status}</td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => downloadPdf(r.id, r.credit_note_no)}
                      className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      Download PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [rows, loading, err]);

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Credit notes</h1>
        <Link
          href={`/${locale}/dashboard/merchant/credit-notes/new`}
          className="rounded-2xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium shadow-glow hover:opacity-90"
        >
          Create credit note
        </Link>
      </div>

      <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
        {content}
      </div>
    </DashboardShell>
  );
}
