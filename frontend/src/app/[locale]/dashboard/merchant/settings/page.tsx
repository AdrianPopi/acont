"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../_components/merchantNav";

function errMsg(e: unknown) {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : "Failed";
}

interface PreferencesTab {
  id: string;
  label: string;
}

type TabContentProps = {
  t: ReturnType<typeof useTranslations>;
};

// Simple Toast Component
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  return (
    <div
      className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4`}
    >
      {message}
    </div>
  );
}

export default function MerchantSettingsPage() {
  const ts = useTranslations("dashboard.merchantSettings");
  const tp = useTranslations("preferences");

  const nav = useMerchantNav();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("logo");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  async function load() {
    setErr("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${base}/merchants/me`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const j = JSON.parse(text);
      setLogoUrl(j.logo_url || null);
    } catch (e: unknown) {
      setErr(errMsg(e));
    }
  }

  async function loadPreferences() {
    setLoading(true);
    setErr("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${base}/preferences/`, {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        // Preferences loaded successfully
      }
    } catch (e: unknown) {
      console.error("Failed to load preferences:", errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  async function onUpload(file: File) {
    setErr("");
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${base}/merchants/me/logo`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const j = JSON.parse(text);
      setLogoUrl(j.logo_url || null);
      setToast({
        message: ts("uploadSuccess"),
        type: "success",
      });
    } catch (e: unknown) {
      setToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadPreferences();
  }, []);

  const base = process.env.NEXT_PUBLIC_API_URL || "/api";
  const absoluteLogo = logoUrl
    ? logoUrl.startsWith("http")
      ? logoUrl
      : `${base}${logoUrl}`
    : null;

  const tabs: PreferencesTab[] = [
    { id: "logo", label: ts("logoTitle") },
    { id: "account", label: tp("tabs.account") },
    { id: "bank", label: tp("tabs.bank") },
    { id: "tax", label: tp("tabs.tax") },
    { id: "template", label: tp("tabs.template") },
    { id: "subscription", label: tp("tabs.subscription") },
    { id: "peppol", label: tp("tabs.peppol") },
    { id: "password", label: tp("tabs.password") },
    { id: "data", label: tp("tabs.data") },
    { id: "archive", label: tp("tabs.archive") },
  ];

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="w-full">
        <h1 className="text-xl font-semibold mb-4">{ts("title")}</h1>
        <p className="text-sm opacity-70 mb-6">{ts("subtitle")}</p>

        {err && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
            {err}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-black/10 dark:border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition text-sm ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "logo" && (
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
              <div className="font-semibold">{ts("logoTitle")}</div>
              <div className="text-sm opacity-70 mt-1">{ts("logoHelp")}</div>

              <div className="mt-4 flex items-center gap-4">
                <div className="h-14 w-40 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
                  {absoluteLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={absoluteLogo}
                      alt="logo"
                      className="h-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-xs opacity-60">{ts("noLogo")}</span>
                  )}
                </div>

                <label className="inline-flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) onUpload(f);
                      e.currentTarget.value = "";
                    }}
                  />
                  {loading ? ts("uploading") : ts("upload")}
                </label>
              </div>
            </div>
          )}
          {activeTab === "account" && (
            <AccountTabContent t={tp} onToast={setToast} />
          )}
          {activeTab === "bank" && <BankTabContent t={tp} onToast={setToast} />}
          {activeTab === "tax" && <TaxTabContent t={tp} onToast={setToast} />}
          {activeTab === "template" && (
            <TemplateTabContent t={tp} onToast={setToast} />
          )}
          {activeTab === "subscription" && <SubscriptionTabContent t={tp} />}
          {activeTab === "peppol" && (
            <PeppolTabContent t={tp} onToast={setToast} />
          )}
          {activeTab === "password" && (
            <PasswordTabContent t={tp} onToast={setToast} />
          )}
          {activeTab === "data" && <DataTabContent t={tp} onToast={setToast} />}
          {activeTab === "archive" && <ArchiveTabContent t={tp} />}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </DashboardShell>
  );
}

// Account Tab
function AccountTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [cui, setCui] = useState("");
  const [commEmail, setCommEmail] = useState("");
  const [clientInvoicesEmail, setClientInvoicesEmail] = useState("");
  const [supplierInvoicesEmail, setSupplierInvoicesEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Load account data on mount
  useEffect(() => {
    async function loadAccountData() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        if (!base) return;

        // Load from preferences/account endpoint
        const res = await fetch(`${base}/preferences/account`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.first_name) setFirstName(data.first_name);
          if (data.last_name) setLastName(data.last_name);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.company_name) setCompanyName(data.company_name);
          if (data.cui) setCui(data.cui);
          if (data.communication_email) setCommEmail(data.communication_email);
          if (data.client_invoices_email)
            setClientInvoicesEmail(data.client_invoices_email);
          if (data.supplier_invoices_email)
            setSupplierInvoicesEmail(data.supplier_invoices_email);
        }
      } catch (e) {
        console.error("Failed to load account data:", e);
      }
    }
    loadAccountData();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          company_name: companyName,
          cui,
          communication_email: commEmail,
          client_invoices_email: clientInvoicesEmail,
          supplier_invoices_email: supplierInvoicesEmail,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      onToast({
        message: t("account.saved"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {t("account.title")}
      </h2>
      <form className="space-y-4" onSubmit={onSave}>
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t("account.firstName")}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <input
            type="text"
            placeholder={t("account.lastName")}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
        </div>
        <input
          type="email"
          placeholder={t("account.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        <input
          type="tel"
          placeholder={t("account.phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        <input
          type="text"
          placeholder={t("account.companyName")}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        <input
          type="text"
          placeholder={t("account.cui")}
          value={cui}
          onChange={(e) => setCui(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
        />
        <input
          type="email"
          placeholder={t("account.communicationEmail")}
          value={commEmail}
          onChange={(e) => setCommEmail(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
        />

        {/* Client Invoices Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t("account.clientInvoicesEmail")}
          </label>
          <input
            type="email"
            placeholder={t("account.clientInvoicesEmailPlaceholder")}
            value={clientInvoicesEmail}
            onChange={(e) => setClientInvoicesEmail(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("account.clientInvoicesEmailHelp")}
          </p>
        </div>

        {/* Supplier Invoices Email */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            {t("account.supplierInvoicesEmail")}
          </label>
          <input
            type="email"
            placeholder={t("account.supplierInvoicesEmailPlaceholder")}
            value={supplierInvoicesEmail}
            onChange={(e) => setSupplierInvoicesEmail(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-white/10 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t("account.supplierInvoicesEmailHelp")}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

// Bank Tab
function BankTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bicCode, setBicCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Load bank details on mount
  useEffect(() => {
    async function loadBankData() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        if (!base) return;
        const res = await fetch(`${base}/preferences/bank`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.bank_name) setBankName(data.bank_name);
          if (data.account_number) setAccountNumber(data.account_number);
          if (data.bic_code) setBicCode(data.bic_code);
        }
      } catch (e) {
        console.error("Failed to load bank details:", e);
      }
    }
    loadBankData();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/bank`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          bank_name: bankName,
          account_number: accountNumber,
          bic_code: bicCode,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      onToast({
        message: t("bank.saved"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("bank.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("bank.description")}
      </p>
      <form className="space-y-4" onSubmit={onSave}>
        <input
          type="text"
          placeholder={t("bank.bankName")}
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <input
          type="text"
          placeholder={t("bank.accountNumber")}
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <input
          type="text"
          placeholder={t("bank.bicCode")}
          value={bicCode}
          onChange={(e) => setBicCode(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

// Tax Tab
function TaxTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [percentage, setPercentage] = useState("");
  const [loading, setLoading] = useState(false);
  const [taxRates, setTaxRates] = useState<
    Array<{ id: string; percentage: number; is_default: boolean }>
  >([]);

  const loadTaxRates = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/tax-rates`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const j = JSON.parse(text);
      setTaxRates(j || []);
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    }
  }, [onToast]);

  useEffect(() => {
    loadTaxRates();
  }, [loadTaxRates]);

  async function addTaxRate(e: React.FormEvent) {
    e.preventDefault();
    if (!percentage) return;

    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/tax-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          percentage: parseFloat(percentage),
          is_default: false,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      setPercentage("");
      await loadTaxRates();
      onToast({
        message: t("tax.saved"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteTaxRate(id: string) {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/tax-rates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete");

      await loadTaxRates();
      onToast({
        message: t("tax.deleted"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("tax.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("tax.description")}
      </p>

      {taxRates.length > 0 && (
        <div className="mb-8 border-b border-black/10 dark:border-white/10 pb-6">
          <h3 className="font-semibold mb-4">{t("tax.presets")}</h3>
          <div className="space-y-2">
            {taxRates.map((rate) => (
              <div
                key={rate.id}
                className="flex items-center justify-between p-3 border border-black/10 dark:border-white/10 rounded"
              >
                <span>{rate.percentage}%</span>
                <button
                  onClick={() => deleteTaxRate(rate.id)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={addTaxRate}>
        <h3 className="font-semibold">{t("tax.addNew")}</h3>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder={t("tax.percentage")}
            min="0"
            max="100"
            step="0.01"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="px-4 py-2 border border-black/10 dark:border-white/10 rounded flex-1 bg-white dark:bg-black/20"
          />
          <button
            type="submit"
            disabled={loading || !percentage}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("common.loading") : t("common.add")}
          </button>
        </div>
      </form>
    </div>
  );
}

// Template Tab
function TemplateTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [fontSize, setFontSize] = useState("12");
  const [bgType, setBgType] = useState("none");
  const [templateStyle, setTemplateStyle] = useState("classic");
  const [loading, setLoading] = useState(false);

  // Load template data on mount
  useEffect(() => {
    async function loadTemplateData() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL;
        if (!base) return;
        const res = await fetch(`${base}/preferences/invoice-template`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.font_size) setFontSize(String(data.font_size));
          if (data.background_type) setBgType(data.background_type);
          if (data.template_style) setTemplateStyle(data.template_style);
        }
      } catch (e) {
        console.error("Failed to load template:", e);
      }
    }
    loadTemplateData();
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/invoice-template`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          font_size: parseInt(fontSize),
          background_type: bgType,
          template_style: templateStyle,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      onToast({
        message: t("template.saved"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("template.title")}</h2>
      <form className="space-y-8" onSubmit={onSave}>
        {/* Background */}
        <div>
          <h3 className="font-semibold mb-4">{t("template.background")}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {["none", "default1", "default2", "default3"].map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setBgType(bg)}
                className={`px-4 py-2 border rounded transition ${
                  bgType === bg
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-500/20"
                    : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {t(
                  `template.background${bg.charAt(0).toUpperCase() + bg.slice(1)}`
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="font-semibold block mb-2">
            {t("template.fontSize")}
          </label>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          >
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="16">16</option>
            <option value="18">18</option>
          </select>
        </div>

        {/* Template Style */}
        <div>
          <h3 className="font-semibold mb-4">{t("template.style")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["classic", "modern", "minimal"].map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setTemplateStyle(style)}
                className={`px-4 py-3 border rounded-lg transition ${
                  templateStyle === style
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-500/20"
                    : "border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <div className="font-medium">
                  {t(
                    `template.style${style.charAt(0).toUpperCase() + style.slice(1)}`
                  )}
                </div>
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {t("template.styleHint")}
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

// Subscription Tab
interface SubscriptionInfo {
  plan: string;
  plan_name?: string;
  status: string;
  expires_at?: string;
  valid_until?: string;
  max_invoices?: number;
  max_clients?: number;
  max_products?: number;
}

function SubscriptionTabContent({ t }: TabContentProps) {
  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/subscription`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const j = JSON.parse(text);
      setSubInfo(j);
    } catch {
      //ignore
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("subscription.title")}</h2>
      {subInfo && (
        <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-lg border border-blue-200 dark:border-blue-500/20">
          <h3 className="font-semibold text-lg mb-2">
            {t("subscription.currentPlan")}
          </h3>
          <p className="text-2xl font-bold mb-2">{subInfo.plan_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Valid until {subInfo.valid_until || "—"}
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="opacity-70">{t("subscription.maxInvoices")}</p>
              <p className="font-semibold">
                {subInfo.max_invoices === -1
                  ? t("subscription.unlimited")
                  : subInfo.max_invoices}
              </p>
            </div>
            <div>
              <p className="opacity-70">{t("subscription.maxClients")}</p>
              <p className="font-semibold">
                {subInfo.max_clients === -1
                  ? t("subscription.unlimited")
                  : subInfo.max_clients}
              </p>
            </div>
            <div>
              <p className="opacity-70">{t("subscription.maxProducts")}</p>
              <p className="font-semibold">
                {subInfo.max_products === -1
                  ? t("subscription.unlimited")
                  : subInfo.max_products}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Email Tab
interface EmailAccount {
  id: string;
  email: string;
  imap_host: string;
  imap_port: number;
  status?: string;
  [key: string]: unknown;
}

function EmailTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [emails, setEmails] = useState<EmailAccount[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("993");
  const [loading, setLoading] = useState(false);

  const loadEmails = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/email-expenses`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const j = JSON.parse(text);
      setEmails(j || []);
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    }
  }, [onToast]);

  useEffect(() => {
    loadEmails();
  }, [loadEmails]);

  async function addEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/email-expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          imap_host: imapHost,
          imap_port: parseInt(imapPort),
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      setEmail("");
      setPassword("");
      setImapHost("");
      await loadEmails();
      onToast({
        message: t("emails.saved"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteEmail(id: string) {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/email-expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete");

      await loadEmails();
      onToast({
        message: t("emails.deleted"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("emails.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("emails.description")}
      </p>

      {emails.length > 0 && (
        <div className="mb-8 border-b border-black/10 dark:border-white/10 pb-6">
          <h3 className="font-semibold mb-4">{t("emails.title")}</h3>
          <div className="space-y-2">
            {emails.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between p-3 border border-black/10 dark:border-white/10 rounded"
              >
                <span>{e.email}</span>
                <button
                  onClick={() => deleteEmail(e.id)}
                  className="text-red-500 text-sm hover:text-red-700"
                >
                  {t("common.delete")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form className="space-y-4" onSubmit={addEmail}>
        <h3 className="font-semibold">{t("emails.addNew")}</h3>
        <input
          type="email"
          placeholder={t("emails.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <input
          type="password"
          placeholder={t("emails.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <input
          type="text"
          placeholder={t("emails.imapHost")}
          value={imapHost}
          onChange={(e) => setImapHost(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <input
          type="number"
          placeholder={t("emails.imapPort")}
          value={imapPort}
          onChange={(e) => setImapPort(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <button
          type="submit"
          disabled={loading || !email || !password}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("common.add")}
        </button>
      </form>
    </div>
  );
}

// PEPPOL Tab
interface PeppolInfo {
  peppol_id?: string;
  integration_status?: string;
  is_integrated?: boolean;
  [key: string]: unknown;
}

function PeppolTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [peppolId, setPeppolId] = useState("");
  const [loading, setLoading] = useState(false);
  const [peppolInfo, setPeppolInfo] = useState<PeppolInfo | null>(null);

  const loadPeppol = useCallback(async () => {
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/peppol`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const j = JSON.parse(text);
      setPeppolInfo(j);
      setPeppolId(j.peppol_id || "");
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    }
  }, [onToast]);

  useEffect(() => {
    loadPeppol();
  }, [loadPeppol]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/preferences/peppol`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          peppol_id: peppolId,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      onToast({
        message: t("peppol.saved"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  const statusColor =
    peppolInfo?.integration_status === "active"
      ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
      : peppolInfo?.integration_status === "pending"
        ? "bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20"
        : "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";

  const statusIcon =
    peppolInfo?.integration_status === "active"
      ? "✅"
      : peppolInfo?.integration_status === "pending"
        ? "⏳"
        : "ℹ️";

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("peppol.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("peppol.description")}
      </p>

      {/* Info Box - What is PEPPOL */}
      <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded border border-purple-200 dark:border-purple-500/20 mb-6">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          {t("peppol.whatIs")}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          {t("peppol.whatIsDescription")}
        </p>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
          <li>• {t("peppol.step1")}</li>
          <li>• {t("peppol.step2")}</li>
          <li>• {t("peppol.step3")}</li>
        </ul>
      </div>

      <form className="space-y-6" onSubmit={onSave}>
        {/* Status Card */}
        <div className={`p-4 rounded border ${statusColor}`}>
          <h3 className="font-semibold mb-2">{t("peppol.status")}</h3>
          <p className="text-lg font-bold flex items-center gap-2">
            <span>{statusIcon}</span>
            {peppolInfo?.integration_status === "active"
              ? t("peppol.statusActive")
              : peppolInfo?.integration_status === "pending"
                ? t("peppol.statusPending")
                : t("peppol.statusNotStarted")}
          </p>
          {peppolInfo?.integration_status === "active" && peppolId && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {t("peppol.currentId")}:{" "}
              <code className="bg-black/5 dark:bg-white/5 px-2 py-1 rounded">
                {peppolId}
              </code>
            </p>
          )}
        </div>

        {/* Input Field */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {t("peppol.peppolId")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="0208:BE0123456789"
            value={peppolId}
            onChange={(e) => setPeppolId(e.target.value)}
            className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
          />
          <p className="text-xs text-gray-500 mt-1">{t("peppol.idFormat")}</p>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={loading || !peppolId.trim()}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("common.loading") : t("peppol.startIntegration")}
        </button>

        {/* Help Link */}
        <a
          href="https://peppol.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline block"
        >
          {t("peppol.learn")} →
        </a>
      </form>
    </div>
  );
}

// Password Tab
function PasswordTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      onToast({
        message: "Passwords don't match",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/auth/me/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onToast({
        message: t("password.changed"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("password.title")}</h2>
      <form className="space-y-4 max-w-md" onSubmit={onSave}>
        <input
          type="password"
          placeholder={t("password.current")}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <input
          type="password"
          placeholder={t("password.new")}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <input
          type="password"
          placeholder={t("password.newConfirm")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="px-4 py-2 border border-black/10 dark:border-white/10 rounded w-full bg-white dark:bg-black/20"
        />
        <p className="text-xs opacity-70">{t("password.requirements")}</p>
        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

// Data Tab
function DataTabContent({
  t,
  onToast,
}: TabContentProps & {
  onToast: (toast: { message: string; type: "success" | "error" }) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function downloadData() {
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/auth/me/data`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to download");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data.json";
      a.click();
      URL.revokeObjectURL(url);

      onToast({
        message: t("data.downloaded"),
        type: "success",
      });
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("Are you sure? This cannot be undone!")) return;

    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/auth/me`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete");

      onToast({
        message: t("data.deleted"),
        type: "success",
      });

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (e: unknown) {
      onToast({
        message: errMsg(e),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("data.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
        {t("data.description")}
      </p>

      <div className="space-y-4">
        <button
          onClick={downloadData}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.loading") : t("data.download")}
        </button>

        <button
          onClick={deleteAccount}
          disabled={loading}
          className="w-full bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {t("data.delete")}
        </button>
      </div>
    </div>
  );
}

// Archive Tab
function ArchiveTabContent({ t }: TabContentProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <div className="bg-[rgb(var(--card))] rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("archive.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("archive.description")}
      </p>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            {t("archive.search")}
          </button>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-400">
        {t("archive.noResults")}
      </p>
    </div>
  );
}
