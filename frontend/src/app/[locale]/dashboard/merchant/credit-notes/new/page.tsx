"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../../_components/merchantNav";

type ClientOut = {
  id: number;
  name: string;
  email?: string | null;
  tax_id?: string | null;
  address?: string | null;
};

type EligibleInvoiceOut = {
  id: number;
  invoice_no: string;
  issue_date: string;
  client_name: string;
  total_gross: number;
};

type SourceInvoiceItem = {
  item_code: string;
  description: string;
  unit_price: number;
  quantity: number;
  vat_rate: number;
  line_net: number;
  line_vat: number;
  line_gross: number;
};

type SourceInvoice = {
  id: number;
  invoice_no: string;
  issue_date: string;
  client_name: string;
  currency: string;
  language: string;
  subtotal_net: number;
  vat_total: number;
  total_gross: number;
  items: SourceInvoiceItem[];
};

type CreditNoteMeta = {
  last_issued_date: string | null;
  next_credit_note_no: string | null;
};

type CreditNoteCreatePayload = {
  invoice_id: number;
  issue_date: string;
  language: "FR" | "EN" | "NL";
  currency: "EUR";
  communication_mode: "simple" | "structured";
  communication_reference: string;
  template: "classic" | "modern" | "minimal";
  notes: string;
  issue_now: boolean;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function parseErrorText(text: string) {
  try {
    const j = JSON.parse(text) as { detail?: string; message?: string };
    return j.detail || j.message || text;
  } catch {
    return text;
  }
}

function isLang(v: string): v is "FR" | "EN" | "NL" {
  const x = v.toUpperCase();
  return x === "FR" || x === "EN" || x === "NL";
}

function isTemplate(v: string): v is "classic" | "modern" | "minimal" {
  return v === "classic" || v === "modern" || v === "minimal";
}

export default function NewCreditNotePage() {
  const locale = useLocale();
  const router = useRouter();
  const nav = useMerchantNav();
  const t = useTranslations("dashboard.creditNotesNew");

  const base = process.env.NEXT_PUBLIC_API_URL || "";

  const [clients, setClients] = useState<ClientOut[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);

  const [invoices, setInvoices] = useState<EligibleInvoiceOut[]>([]);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);

  const [source, setSource] = useState<SourceInvoice | null>(null);

  const [issueDate, setIssueDate] = useState(todayISO());
  const [lastIssuedDate, setLastIssuedDate] = useState<string | null>(null);
  const [nextNo, setNextNo] = useState<string | null>(null);

  const [communicationMode, setCommunicationMode] = useState<
    "simple" | "structured"
  >("simple");
  const [communicationReference, setCommunicationReference] = useState("");

  const [template, setTemplate] = useState<"classic" | "modern" | "minimal">(
    "classic"
  );
  const [language, setLanguage] = useState<"FR" | "EN" | "NL">("FR");
  const [issueNow, setIssueNow] = useState(true);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setErr("");
    try {
      const res = await fetch(`${base}/clients/`, {
        credentials: "include",
        cache: "no-store",
      });

      const text = await res.text();
      if (!res.ok) throw new Error(parseErrorText(text));

      const data = JSON.parse(text) as ClientOut[];
      setClients(data);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("errorLoadClients"));
    }
  }, [base, t]);

  const loadMeta = useCallback(
    async (d: string) => {
      try {
        const res = await fetch(
          `${base}/credit-notes/meta?issue_date=${encodeURIComponent(d)}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const txt = await res.text();
        if (!res.ok) return;

        const meta = JSON.parse(txt) as CreditNoteMeta;
        setLastIssuedDate(
          meta.last_issued_date ? String(meta.last_issued_date) : null
        );
        setNextNo(
          meta.next_credit_note_no ? String(meta.next_credit_note_no) : null
        );
      } catch {
        // ignore
      }
    },
    [base]
  );

  const loadInvoicesForClient = useCallback(
    async (cid: number) => {
      setErr("");
      setInvoices([]);
      setInvoiceId(null);
      setSource(null);

      try {
        const res = await fetch(
          `${base}/credit-notes/eligible-invoices?client_id=${cid}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const txt = await res.text();
        if (!res.ok) throw new Error(parseErrorText(txt));

        const data = JSON.parse(txt) as EligibleInvoiceOut[];
        setInvoices(data);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : t("errorLoadInvoices"));
      }
    },
    [base, t]
  );

  const loadSourceInvoice = useCallback(
    async (id: number) => {
      setErr("");
      setSource(null);

      try {
        const res = await fetch(`${base}/credit-notes/source-invoice/${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        const txt = await res.text();
        if (!res.ok) throw new Error(parseErrorText(txt));

        const j = JSON.parse(txt) as SourceInvoice;
        setSource(j);

        const L = String(j.language || "").toUpperCase();
        if (isLang(L)) setLanguage(L);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : t("errorLoadInvoiceDetails"));
      }
    },
    [base, t]
  );

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    loadMeta(issueDate);
  }, [issueDate, loadMeta]);

  useEffect(() => {
    if (!clientId) return;
    loadInvoicesForClient(clientId);
  }, [clientId, loadInvoicesForClient]);

  useEffect(() => {
    if (!invoiceId) return;
    loadSourceInvoice(invoiceId);
  }, [invoiceId, loadSourceInvoice]);

  const canSubmit = useMemo(() => !!invoiceId && !!source, [invoiceId, source]);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!invoiceId) return;

      setErr("");
      setLoading(true);

      try {
        const payload: CreditNoteCreatePayload = {
          invoice_id: invoiceId,
          issue_date: issueDate,
          language,
          currency: "EUR",
          communication_mode: communicationMode,
          communication_reference:
            communicationMode === "structured" ? communicationReference : "",
          template,
          notes: "",
          issue_now: issueNow,
        };

        const res = await fetch(`${base}/credit-notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const txt = await res.text();
        if (!res.ok) throw new Error(parseErrorText(txt));

        router.push(`/${locale}/dashboard/merchant/credit-notes`);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : t("errorCreate"));
      } finally {
        setLoading(false);
      }
    },
    [
      base,
      communicationMode,
      communicationReference,
      invoiceId,
      issueDate,
      issueNow,
      language,
      locale,
      router,
      t,
      template,
    ]
  );

  const maxIssueDate = todayISO();
  const minIssueDate = lastIssuedDate || "";

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm opacity-70">
            {issueNow
              ? t("subtitleIssueNow", { no: nextNo ?? "..." })
              : t("subtitleDraft")}
            {lastIssuedDate
              ? ` • ${t("subtitleLastIssued", { date: lastIssuedDate })}`
              : ""}
          </p>
        </div>
      </div>

      {err && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {err}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("client")}
              </label>
              <select
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                value={clientId ?? ""}
                onChange={(e) =>
                  setClientId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">{t("chooseClient")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.tax_id ? `(${c.tax_id})` : ""}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs opacity-60">{t("clientHint")}</div>
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("invoiceToCredit")}
              </label>
              <select
                disabled={!clientId}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2 disabled:opacity-60"
                value={invoiceId ?? ""}
                onChange={(e) =>
                  setInvoiceId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">{t("chooseInvoice")}</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.invoice_no} • {i.issue_date} •{" "}
                    {Number(i.total_gross).toFixed(2)} EUR
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs opacity-60">{t("invoiceHint")}</div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5 grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("issueDate")}
              </label>
              <input
                type="date"
                min={minIssueDate || undefined}
                max={maxIssueDate}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("language")}
              </label>
              <select
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                value={language}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  if (isLang(v)) setLanguage(v);
                }}
              >
                <option value="FR">FR</option>
                <option value="EN">EN</option>
                <option value="NL">NL</option>
              </select>
              <div className="mt-1 text-xs opacity-60">{t("languageHint")}</div>
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("template")}
              </label>
              <select
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                value={template}
                onChange={(e) => {
                  const v = e.target.value;
                  if (isTemplate(v)) setTemplate(v);
                }}
              >
                <option value="classic">{t("templateClassic")}</option>
                <option value="modern">{t("templateModern")}</option>
                <option value="minimal">{t("templateMinimal")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("communication")}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="comm"
                    checked={communicationMode === "simple"}
                    onChange={() => setCommunicationMode("simple")}
                  />
                  {t("simple")}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="comm"
                    checked={communicationMode === "structured"}
                    onChange={() => setCommunicationMode("structured")}
                  />
                  {t("structured")}
                </label>
              </div>
              {communicationMode === "structured" && (
                <input
                  className="mt-2 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                  value={communicationReference}
                  onChange={(e) => setCommunicationReference(e.target.value)}
                  placeholder={t("structuredPlaceholder")}
                />
              )}
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={issueNow}
                  onChange={(e) => setIssueNow(e.target.checked)}
                />
                {t("issueNow")}
              </label>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
          <div className="font-semibold">{t("previewTitle")}</div>
          {!source ? (
            <div className="mt-2 text-sm opacity-70">{t("previewEmpty")}</div>
          ) : (
            <>
              <div className="mt-2 text-sm opacity-80">
                <div>
                  <span className="opacity-70">{t("previewInvoice")}:</span>{" "}
                  <span className="font-medium">{source.invoice_no}</span>
                </div>
                <div>
                  <span className="opacity-70">{t("previewClient")}:</span>{" "}
                  <span className="font-medium">{source.client_name}</span>
                </div>
                <div className="mt-2">
                  <span className="opacity-70">{t("previewTotals")}:</span>{" "}
                  <span className="font-medium">
                    {Number(source.total_gross).toFixed(2)} {source.currency}
                  </span>
                </div>
                <div className="mt-2 text-xs opacity-60">
                  {t("previewHint")}
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="opacity-70">
                    <tr className="text-left">
                      <th className="py-2">{t("colCode")}</th>
                      <th className="py-2">{t("colDescription")}</th>
                      <th className="py-2">{t("colQty")}</th>
                      <th className="py-2">{t("colVat")}</th>
                      <th className="py-2 text-right">{t("colLineTotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {source.items.map((it, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-black/10 dark:border-white/10"
                      >
                        <td className="py-3">{it.item_code}</td>
                        <td className="py-3">{it.description}</td>
                        <td className="py-3">{it.quantity}</td>
                        <td className="py-3">{it.vat_rate}</td>
                        <td className="py-3 text-right">
                          {Number(it.line_gross).toFixed(2)} EUR
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <button
          disabled={!canSubmit || loading}
          className="rounded-2xl bg-brand-gradient px-4 py-2 text-black font-medium shadow-glow disabled:opacity-60"
        >
          {loading ? t("saving") : t("save")}
        </button>
      </form>
    </DashboardShell>
  );
}
