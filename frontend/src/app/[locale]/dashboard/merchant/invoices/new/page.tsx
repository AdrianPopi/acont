"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../../_components/merchantNav";
import TemplateSelector from "@/components/dashboard/TemplateSelector";

type ClientOut = {
  id: number;
  name: string;
  email?: string | null;
  tax_id?: string | null;
  address?: string | null;
};

type ProductOut = {
  id: number;
  code?: string | null;
  name: string;
  description?: string | null;
  unit_price: number;
  vat_rate: number;
};

type Item = {
  product_id: number | null;
  item_code: string;
  description: string;
  unit_price: string;
  quantity: string;
  vat_rate: string;
};

type CommMode = "simple" | "structured";
type Template = "classic" | "modern" | "minimal";
type Lang = "FR" | "EN" | "NL";

function num(v: string) {
  const x = Number(String(v || "0").replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function errMsg(e: unknown, fallback: string) {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === "string") return e || fallback;
  try {
    return JSON.stringify(e) || fallback;
  } catch {
    return fallback;
  }
}

export default function NewInvoicePage() {
  const locale = useLocale();
  const router = useRouter();
  const nav = useMerchantNav();
  const t = useTranslations("dashboard.invoicesNew");

  const base = process.env.NEXT_PUBLIC_API_URL || "/api";

  // date + meta
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [lastIssuedDate, setLastIssuedDate] = useState<string | null>(null);
  const [nextInvoiceNo, setNextInvoiceNo] = useState<string | null>(null);

  // mode
  const [issueNow, setIssueNow] = useState(true);

  // client
  const [clients, setClients] = useState<ClientOut[]>([]);
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState<number | null>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientTaxId, setClientTaxId] = useState("");
  const [clientAddress, setClientAddress] = useState("");

  // settings
  const [language, setLanguage] = useState<Lang>("FR");
  const [currency] = useState("EUR");
  const [communicationMode, setCommunicationMode] =
    useState<CommMode>("simple");
  const [communicationReference, setCommunicationReference] = useState("");
  const [template, setTemplate] = useState<Template>("classic");

  const [discount, setDiscount] = useState("0");
  const [advance, setAdvance] = useState("0");

  // merchant emails for sending
  const [merchantEmails, setMerchantEmails] = useState<{
    communication_email: string;
    client_invoices_email: string;
  }>({ communication_email: "", client_invoices_email: "" });
  const [senderEmail, setSenderEmail] = useState("");

  // products
  const [products, setProducts] = useState<ProductOut[]>([]);
  const [items, setItems] = useState<Item[]>([
    {
      product_id: null,
      item_code: "",
      description: "",
      unit_price: "0",
      quantity: "1",
      vat_rate: "21",
    },
  ]);

  // ui
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const loadBasics = useCallback(async () => {
    setErr("");
    try {
      const [cRes, pRes, tplRes, accRes] = await Promise.all([
        fetch(`${base}/clients/`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${base}/products/`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${base}/preferences/invoice-template`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`${base}/preferences/account`, {
          credentials: "include",
          cache: "no-store",
        }),
      ]);

      const cTxt = await cRes.text();
      if (!cRes.ok) throw new Error(cTxt);
      setClients(JSON.parse(cTxt) as ClientOut[]);

      const pTxt = await pRes.text();
      if (!pRes.ok) throw new Error(pTxt);
      setProducts(JSON.parse(pTxt) as ProductOut[]);

      // Load preferred template
      if (tplRes.ok) {
        const tplData = await tplRes.json();
        if (tplData.template_style) {
          setTemplate(tplData.template_style as Template);
        }
      }

      // Load merchant emails
      if (accRes.ok) {
        const accData = await accRes.json();
        setMerchantEmails({
          communication_email: accData.communication_email || "",
          client_invoices_email: accData.client_invoices_email || "",
        });
        // Default to client invoices email if available
        setSenderEmail(
          accData.client_invoices_email || accData.communication_email || ""
        );
      }
    } catch (e: unknown) {
      setErr(errMsg(e, t("errorLoad")));
    }
  }, [base, t]);

  const loadMeta = useCallback(
    async (d: string) => {
      try {
        if (!base) return;

        const res = await fetch(
          `${base}/invoices/meta?issue_date=${encodeURIComponent(d)}`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );
        const txt = await res.text();
        if (!res.ok) return;

        const j = JSON.parse(txt) as {
          last_issued_date?: string | null;
          next_invoice_no?: string | null;
        };

        setLastIssuedDate(
          j.last_issued_date ? String(j.last_issued_date) : null
        );
        setNextInvoiceNo(j.next_invoice_no ? String(j.next_invoice_no) : null);
      } catch {
        // ignore meta errors
      }
    },
    [base]
  );

  useEffect(() => {
    loadBasics();
  }, [loadBasics]);

  useEffect(() => {
    loadMeta(issueDate);
  }, [issueDate, loadMeta]);

  useEffect(() => {
    if (clientMode !== "existing") return;
    if (!clientId) return;
    const c = clients.find((x) => x.id === clientId);
    if (!c) return;
    setClientName(c.name || "");
    setClientEmail(c.email || "");
    setClientTaxId(c.tax_id || "");
    setClientAddress(c.address || "");
  }, [clientMode, clientId, clients]);

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }
  function addLine() {
    setItems((prev) => [
      ...prev,
      {
        product_id: null,
        item_code: "",
        description: "",
        unit_price: "0",
        quantity: "1",
        vat_rate: "21",
      },
    ]);
  }
  function removeLine(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function onPickProduct(idx: number, productId: number | null) {
    if (!productId) {
      updateItem(idx, { product_id: null });
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    updateItem(idx, {
      product_id: p.id,
      item_code: (p.code || "").toString(),
      description: p.name,
      unit_price: String(p.unit_price ?? 0),
      vat_rate: String(p.vat_rate ?? 0),
    });
  }

  async function importClientFile(file: File) {
    setErr("");
    try {
      const text = await file.text();
      const j = JSON.parse(text) as Partial<{
        name: string;
        email: string;
        tax_id: string;
        taxId: string;
        address: string;
      }>;

      setClientMode("new");
      setClientId(null);
      setClientName(j.name || "");
      setClientEmail(j.email || "");
      setClientTaxId(j.tax_id || j.taxId || "");
      setClientAddress(j.address || "");
    } catch {
      setErr(t("importClientError"));
    }
  }

  const totals = useMemo(() => {
    const disc = Math.max(0, num(discount)) / 100;

    let subtotalNetBefore = 0;
    let subtotalNet = 0;
    let vatTotal = 0;

    const breakdown: Record<string, { base: number; vat: number }> = {};

    for (const it of items) {
      if (!it.description.trim()) continue;
      const q = num(it.quantity);
      const up = num(it.unit_price);
      const rate = num(it.vat_rate);

      const netBefore = q * up;
      const net = netBefore * (1 - disc);
      const vat = net * (rate / 100);

      subtotalNetBefore += netBefore;
      subtotalNet += net;
      vatTotal += vat;

      const k = String(rate);
      breakdown[k] ||= { base: 0, vat: 0 };
      breakdown[k].base += net;
      breakdown[k].vat += vat;
    }

    const discountAmount = subtotalNetBefore - subtotalNet;
    const totalGross = subtotalNet + vatTotal;
    const advancePaid = Math.max(0, num(advance));
    const totalDue = Math.max(0, totalGross - advancePaid);

    return {
      subtotalNet,
      discountAmount,
      breakdown,
      vatTotal,
      totalGross,
      advancePaid,
      totalDue,
    };
  }, [items, discount, advance]);

  const maxIssueDate = todayISO();
  const minIssueDate = lastIssuedDate || ""; // backend enforces too

  const canSubmit = useMemo(() => {
    const hasLines = items.some((i) => i.description.trim());
    return clientName.trim() && hasLines;
  }, [clientName, items]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const payload = {
        client_id: clientMode === "existing" ? clientId : null,
        client_name: clientName,
        client_email: clientEmail,
        client_tax_id: clientTaxId,
        client_address: clientAddress,

        issue_date: issueDate,
        due_date: dueDate || null,

        communication_mode: communicationMode,
        communication_reference:
          communicationMode === "structured" ? communicationReference : "",

        language,
        currency: "EUR",
        template,

        discount_percent: num(discount),
        advance_paid: num(advance),
        notes: "",
        issue_now: issueNow,

        items: items
          .filter((i) => i.description.trim())
          .map((i) => ({
            product_id: i.product_id,
            item_code: i.item_code || "",
            description: i.description,
            unit_price: num(i.unit_price),
            quantity: num(i.quantity),
            vat_rate: num(i.vat_rate),
          })),
      };

      const res = await fetch(`${base}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      router.push(`/${locale}/dashboard/merchant/invoices`);
    } catch (e: unknown) {
      setErr(errMsg(e, "Failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 text-sm opacity-70">
            {issueNow
              ? t("subtitleIssueNow", { no: nextInvoiceNo ?? "..." })
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
        {/* CLIENT */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-semibold">{t("client")}</div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setClientMode("existing")}
                className={`rounded-xl border px-3 py-1.5 text-sm ${
                  clientMode === "existing"
                    ? "border-black/20 dark:border-white/20"
                    : "border-black/10 dark:border-white/10 opacity-70"
                }`}
              >
                {t("existing")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setClientMode("new");
                  setClientId(null);
                }}
                className={`rounded-xl border px-3 py-1.5 text-sm ${
                  clientMode === "new"
                    ? "border-black/20 dark:border-white/20"
                    : "border-black/10 dark:border-white/10 opacity-70"
                }`}
              >
                {t("new")}
              </button>
            </div>

            <label className="ml-auto inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) importClientFile(f);
                  e.currentTarget.value = "";
                }}
              />
              {t("importClient")}
            </label>
          </div>

          {clientMode === "existing" && (
            <div className="mt-3">
              <label className="block text-sm opacity-80 mb-1">
                {t("selectClient")}
              </label>
              <select
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                value={clientId ?? ""}
                onChange={(e) =>
                  setClientId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">{t("choose")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.tax_id ? `(${c.tax_id})` : ""}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-xs opacity-60">{t("autoFillHint")}</div>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("clientName")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("clientEmail")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("taxId")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={clientTaxId}
                onChange={(e) => setClientTaxId(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("address")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* INVOICE SETTINGS */}
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
              {lastIssuedDate && (
                <div className="mt-1 text-xs opacity-60">
                  {t("mustBeAfterLastIssued", { date: lastIssuedDate })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("dueDate")}
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("language")}
              </label>
              <select
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                value={language}
                onChange={(e) => setLanguage(e.target.value as Lang)}
              >
                <option value="FR">FR</option>
                <option value="EN">EN</option>
                <option value="NL">NL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("currency")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={currency}
                disabled
              />
              <div className="mt-1 text-xs opacity-60">{t("currencyHint")}</div>
            </div>

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

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("template")}
              </label>
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2 text-left flex items-center justify-between hover:border-blue-500 transition"
              >
                <span>
                  {template === "classic" && t("templateClassic")}
                  {template === "modern" && t("templateModern")}
                  {template === "minimal" && t("templateMinimal")}
                </span>
                <span className="text-blue-500">🎨</span>
              </button>
              <div className="mt-1 text-xs opacity-60">{t("templateHint")}</div>
            </div>
          </div>

          {/* Sender Email Selection */}
          {(merchantEmails.client_invoices_email ||
            merchantEmails.communication_email) && (
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("senderEmail")}
              </label>
              <select
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              >
                {merchantEmails.client_invoices_email && (
                  <option value={merchantEmails.client_invoices_email}>
                    {t("clientInvoicesEmailOption")} -{" "}
                    {merchantEmails.client_invoices_email}
                  </option>
                )}
                {merchantEmails.communication_email && (
                  <option value={merchantEmails.communication_email}>
                    {t("communicationEmailOption")} -{" "}
                    {merchantEmails.communication_email}
                  </option>
                )}
              </select>
              <div className="mt-1 text-xs opacity-60">
                {t("senderEmailHint")}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("discount")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                inputMode="decimal"
              />
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {t("advancePaid")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                inputMode="decimal"
              />
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

        {/* LINES */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{t("linesTitle")}</div>
              <div className="text-xs opacity-60 mt-1">{t("linesHint")}</div>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {t("addLine")}
            </button>
          </div>

          <div className="hidden lg:grid mt-4 mb-2 text-xs opacity-60 grid-cols-[60px_220px_120px_1fr_140px_120px_120px_140px_90px] gap-2 px-1">
            <div>#</div>
            <div>{t("colProduct")}</div>
            <div>{t("colArticleNo")}</div>
            <div>{t("colDescription")}</div>
            <div>{t("colValueExclVat")}</div>
            <div>{t("colQty")}</div>
            <div>{t("colVat")}</div>
            <div>{t("colTotalInclVat")}</div>
            <div className="text-right">{t("colActions")}</div>
          </div>

          <div className="grid gap-3 mt-2">
            {items.map((it, idx) => {
              const disc = Math.max(0, num(discount)) / 100;
              const net = num(it.quantity) * num(it.unit_price) * (1 - disc);
              const vat = net * (num(it.vat_rate) / 100);
              const gross = net + vat;

              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 lg:grid-cols-[60px_220px_120px_1fr_140px_120px_120px_140px_90px] gap-2"
                >
                  <div className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm opacity-70 flex items-center">
                    {idx + 1}
                  </div>

                  <select
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                    value={it.product_id ?? ""}
                    onChange={(e) =>
                      onPickProduct(
                        idx,
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">{t("manual")}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {(p.code ? `${p.code} • ` : "") + p.name}
                      </option>
                    ))}
                  </select>

                  <input
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                    value={it.item_code}
                    onChange={(e) =>
                      updateItem(idx, { item_code: e.target.value })
                    }
                    placeholder="0001"
                  />

                  <input
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                    value={it.description}
                    onChange={(e) =>
                      updateItem(idx, { description: e.target.value })
                    }
                    placeholder={t("productOrService")}
                  />

                  <input
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                    value={it.unit_price}
                    onChange={(e) =>
                      updateItem(idx, { unit_price: e.target.value })
                    }
                    inputMode="decimal"
                    placeholder="0"
                  />

                  <input
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                    value={it.quantity}
                    onChange={(e) =>
                      updateItem(idx, { quantity: e.target.value })
                    }
                    inputMode="decimal"
                    placeholder="1"
                  />

                  <input
                    className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                    value={it.vat_rate}
                    onChange={(e) =>
                      updateItem(idx, { vat_rate: e.target.value })
                    }
                    inputMode="decimal"
                    placeholder="21"
                  />

                  <div className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm flex items-center justify-between">
                    <span className="opacity-70">{t("ttc")}</span>
                    <span className="font-medium">{gross.toFixed(2)} EUR</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    {t("remove")}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOTALS */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
          <div className="font-semibold">{t("totalsTitle")}</div>

          <div className="mt-3 grid gap-2 text-sm">
            <div className="flex justify-between">
              <span>{t("totalExclVat")}</span>
              <span>{totals.subtotalNet.toFixed(2)} EUR</span>
            </div>

            <div className="flex justify-between">
              <span>{t("discountAmount")}</span>
              <span>-{totals.discountAmount.toFixed(2)} EUR</span>
            </div>

            {Object.entries(totals.breakdown)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([rate, v]) => (
                <div key={rate} className="flex justify-between opacity-90">
                  <span>{`VAT ${rate}%`}</span>
                  <span>{v.vat.toFixed(2)} EUR</span>
                </div>
              ))}

            <div className="flex justify-between">
              <span>{t("totalVat")}</span>
              <span>{totals.vatTotal.toFixed(2)} EUR</span>
            </div>

            <div className="mt-2 flex justify-between text-base font-semibold">
              <span>{t("totalInclVat")}</span>
              <span>{totals.totalGross.toFixed(2)} EUR</span>
            </div>

            <div className="flex justify-between">
              <span>{t("advancePaidLabel")}</span>
              <span>{totals.advancePaid.toFixed(2)} EUR</span>
            </div>

            <div className="flex justify-between text-base font-semibold">
              <span>{t("totalDue")}</span>
              <span>{totals.totalDue.toFixed(2)} EUR</span>
            </div>
          </div>
        </div>

        <button
          disabled={!canSubmit || loading}
          className="rounded-2xl bg-brand-gradient px-4 py-2 text-black font-medium shadow-glow disabled:opacity-60"
        >
          {loading ? t("saving") : t("save")}
        </button>
      </form>

      {showTemplateModal && (
        <TemplateSelector
          selected={template}
          onSelect={setTemplate}
          onClose={() => setShowTemplateModal(false)}
        />
      )}
    </DashboardShell>
  );
}
