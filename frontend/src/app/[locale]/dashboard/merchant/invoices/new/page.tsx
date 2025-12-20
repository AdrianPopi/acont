"use client";

import { FormEvent, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

type Item = {
  item_code: string;
  description: string;
  unit_price: string;
  quantity: string;
  vat_rate: string;
};

export default function NewInvoicePage() {
  const locale = useLocale();
  const router = useRouter();
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

  const today = new Date().toISOString().slice(0, 10);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  // IMPORTANT: uppercase codes, incl. RO
  const [language, setLanguage] = useState<"RO" | "FR" | "EN" | "NL">("FR");
  const [discount, setDiscount] = useState("0");
  const [advance, setAdvance] = useState("0");
  const [issueNow, setIssueNow] = useState(true);

  const [items, setItems] = useState<Item[]>([
    {
      item_code: "",
      description: "",
      unit_price: "0",
      quantity: "1",
      vat_rate: "21",
    },
  ]);

  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => clientName.trim() && items.some((i) => i.description.trim()),
    [clientName, items]
  );

  function updateItem(idx: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    );
  }
  function addLine() {
    setItems((prev) => [
      ...prev,
      {
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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) throw new Error("NEXT_PUBLIC_API_URL is missing");

      const payload = {
        client_name: clientName,
        client_email: clientEmail,
        issue_date: issueDate,
        due_date: dueDate || null,
        language, // RO/FR/EN/NL
        currency: "EUR",
        discount_percent: Number(discount || 0),
        advance_paid: Number(advance || 0),
        notes: "",
        issue_now: issueNow,
        items: items
          .filter((i) => i.description.trim())
          .map((i) => ({
            item_code: i.item_code,
            description: i.description,
            unit_price: Number(i.unit_price || 0),
            quantity: Number(i.quantity || 0),
            vat_rate: Number(i.vat_rate || 0),
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
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{ti("createTitle")}</h1>
          <p className="mt-1 text-sm opacity-70">{ti("createSubtitle")}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        {err && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {err}
          </div>
        )}

        {/* Header card */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5 grid gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {ti("clientNameLabel")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={ti("clientNamePlaceholder")}
              />
              <div className="mt-1 text-xs opacity-60">
                {ti("clientNameHelp")}
              </div>
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {ti("clientEmailLabel")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder={ti("clientEmailPlaceholder")}
              />
              <div className="mt-1 text-xs opacity-60">
                {ti("clientEmailHelp")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {ti("issueDateLabel")}
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
              <div className="mt-1 text-xs opacity-60">
                {ti("issueDateHelp")}
              </div>
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {ti("dueDateLabel")}
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <div className="mt-1 text-xs opacity-60">{ti("dueDateHelp")}</div>
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {ti("languageLabel")}
              </label>
              <select
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] px-3 py-2"
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as "RO" | "FR" | "EN" | "NL")
                }
              >
                <option value="RO">RO</option>
                <option value="FR">FR</option>
                <option value="EN">EN</option>
                <option value="NL">NL</option>
              </select>
              <div className="mt-1 text-xs opacity-60">
                {ti("languageHelp")}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm opacity-80 mb-1">
                {ti("discountLabel")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                inputMode="decimal"
              />
              <div className="mt-1 text-xs opacity-60">
                {ti("discountHelp")}
              </div>
            </div>

            <div>
              <label className="block text-sm opacity-80 mb-1">
                {ti("advancePaidLabel")}
              </label>
              <input
                className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                placeholder="0"
                inputMode="decimal"
              />
              <div className="mt-1 text-xs opacity-60">
                {ti("advancePaidHelp")}
              </div>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm opacity-90">
                <input
                  type="checkbox"
                  checked={issueNow}
                  onChange={(e) => setIssueNow(e.target.checked)}
                />
                <span>
                  <div className="font-medium">{ti("issueNowLabel")}</div>
                  <div className="text-xs opacity-60">{ti("issueNowHelp")}</div>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Lines card */}
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{ti("linesTitle")}</div>
              <div className="text-xs opacity-60 mt-1">{ti("linesHelp")}</div>
            </div>
            <button
              type="button"
              onClick={addLine}
              className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
            >
              {ti("addLine")}
            </button>
          </div>

          {/* mini header row (desktop) */}
          <div className="hidden lg:grid mt-4 mb-2 text-xs opacity-60 grid-cols-[120px_1fr_140px_120px_120px_90px] gap-2 px-1">
            <div>{ti("code")}</div>
            <div>{ti("description")}</div>
            <div>{ti("unitPrice")}</div>
            <div>{ti("qty")}</div>
            <div>{ti("vat")}</div>
            <div className="text-right">{ti("actions")}</div>
          </div>

          <div className="grid gap-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 lg:grid-cols-[120px_1fr_140px_120px_120px_90px] gap-2"
              >
                <input
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                  value={it.item_code}
                  onChange={(e) =>
                    updateItem(idx, { item_code: e.target.value })
                  }
                  placeholder={ti("codePlaceholder")}
                />
                <input
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                  value={it.description}
                  onChange={(e) =>
                    updateItem(idx, { description: e.target.value })
                  }
                  placeholder={ti("descriptionPlaceholder")}
                />
                <input
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                  value={it.unit_price}
                  onChange={(e) =>
                    updateItem(idx, { unit_price: e.target.value })
                  }
                  placeholder="0"
                  inputMode="decimal"
                />
                <input
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                  value={it.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: e.target.value })
                  }
                  placeholder="1"
                  inputMode="decimal"
                />
                <input
                  className="rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
                  value={it.vat_rate}
                  onChange={(e) =>
                    updateItem(idx, { vat_rate: e.target.value })
                  }
                  placeholder="21"
                  inputMode="decimal"
                />
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {ti("remove")}
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          disabled={!canSubmit || loading}
          className="rounded-2xl bg-brand-gradient px-4 py-2 text-black font-medium shadow-glow disabled:opacity-60"
        >
          {loading ? ti("saving") : ti("save")}
        </button>
      </form>
    </DashboardShell>
  );
}
