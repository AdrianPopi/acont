"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../../_components/merchantNav";

type InvoiceItemOut = {
  item_code: string;
  description: string;
  unit_price: number;
  quantity: number;
  vat_rate: number;
  line_net: number;
  line_vat: number;
  line_gross: number;
};

type InvoiceOut = {
  id: number;
  invoice_no: string;
  status: string;
  issue_date: string;
  due_date?: string | null;
  client_name: string;
  total_gross: number;
  advance_paid: number;

  currency: string;
  language: string;
  subtotal_net: number;
  vat_total: number;
  notes: string;

  items?: InvoiceItemOut[]; // îl primim dacă adaugi items în backend
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

export default function InvoiceViewPage() {
  const locale = useLocale();
  const nav = useMerchantNav();
  const t = useTranslations("dashboard.invoiceView");
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const id = Number(params?.id);
  const base = process.env.NEXT_PUBLIC_API_URL || "";

  const [inv, setInv] = useState<InvoiceOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      if (!base) throw new Error("NEXT_PUBLIC_API_URL is missing");
      if (!Number.isFinite(id)) throw new Error("Invalid invoice id");

      const res = await fetch(`${base}/invoices/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const txt = await res.text();
      if (!res.ok) throw new Error(parseErrorText(txt));
      setInv(JSON.parse(txt) as InvoiceOut);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("errorLoad"));
    } finally {
      setLoading(false);
    }
  }, [base, id, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const due = useMemo(() => {
    if (!inv) return 0;
    return Number(inv.total_gross) - Number(inv.advance_paid || 0);
  }, [inv]);

  async function downloadPdf() {
    if (!inv || !base) return;
    const res = await fetch(`${base}/invoices/${inv.id}/pdf`, {
      credentials: "include",
    });
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoice_no || `invoice-${inv.id}`}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm opacity-70">{t("subtitle")}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              router.push(`/${locale}/dashboard/merchant/invoices`)
            }
            className="rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
          >
            {t("back")}
          </button>
          <button
            onClick={downloadPdf}
            className="rounded-2xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium shadow-glow hover:opacity-90"
          >
            {t("downloadPdf")}
          </button>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {err}
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
        {loading ? (
          <div className="text-sm opacity-70">{t("loading")}</div>
        ) : !inv ? (
          <div className="text-sm opacity-70">{t("notFound")}</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm opacity-70">{t("invoiceNo")}</div>
                <div className="text-xl font-semibold">{inv.invoice_no}</div>
              </div>
              <div className="text-sm opacity-70">
                {t("status")}:{" "}
                <span className="font-medium opacity-100">{inv.status}</span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label={t("client")} value={inv.client_name} />
              <Info label={t("issueDate")} value={inv.issue_date} />
              <Info label={t("dueDate")} value={inv.due_date || "—"} />
              <Info
                label={t("subtotal")}
                value={`${money(Number(inv.subtotal_net))} ${inv.currency}`}
              />
              <Info
                label={t("vatTotal")}
                value={`${money(Number(inv.vat_total))} ${inv.currency}`}
              />
              <Info
                label={t("total")}
                value={`${money(Number(inv.total_gross))} ${inv.currency}`}
              />
              <Info
                label={t("advance")}
                value={`${money(Number(inv.advance_paid))} ${inv.currency}`}
              />
              <Info
                label={t("due")}
                value={`${money(Number(due))} ${inv.currency}`}
              />
              <Info
                label={t("language")}
                value={String(inv.language || "").toUpperCase()}
              />
            </div>

            <div className="mt-4">
              <div className="text-sm opacity-70">{t("notes")}</div>
              <div className="mt-1 rounded-2xl border border-black/10 dark:border-white/10 px-4 py-3 text-sm">
                {inv.notes?.trim() ? inv.notes : "—"}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-semibold">{t("linesTitle")}</div>

              {!inv.items || inv.items.length === 0 ? (
                <div className="mt-2 text-sm opacity-70">
                  {t("linesMissingHint")}
                </div>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="opacity-70">
                      <tr className="text-left">
                        <th className="py-2">{t("colCode")}</th>
                        <th className="py-2">{t("colDesc")}</th>
                        <th className="py-2">{t("colQty")}</th>
                        <th className="py-2">{t("colVat")}</th>
                        <th className="py-2 text-right">{t("colTotal")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((it, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-black/10 dark:border-white/10"
                        >
                          <td className="py-3">{it.item_code}</td>
                          <td className="py-3">{it.description}</td>
                          <td className="py-3">{it.quantity}</td>
                          <td className="py-3">{it.vat_rate}%</td>
                          <td className="py-3 text-right">
                            {money(Number(it.line_gross))} {inv.currency}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 p-4">
      <div className="text-xs opacity-70">{label}</div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
