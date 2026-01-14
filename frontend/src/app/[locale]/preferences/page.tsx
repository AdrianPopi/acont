"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect, FormEvent } from "react";
import { apiFetch } from "@/lib/api";

interface PreferencesTab {
  id: string;
  label: string;
}

type TabContentProps = {
  t: ReturnType<typeof useTranslations>;
};

interface BankDetails {
  id?: string;
  bank_name: string;
  account_number: string;
  bic_code: string;
}

interface TaxRate {
  id: string;
  percentage: number;
  is_default: boolean;
}

export default function PreferencesPage() {
  const t = useTranslations("preferences");
  const [activeTab, setActiveTab] = useState<string>("account");

  const tabs: PreferencesTab[] = [
    { id: "account", label: t("tabs.account") },
    { id: "bank", label: t("tabs.bank") },
    { id: "tax", label: t("tabs.tax") },
    { id: "template", label: t("tabs.template") },
    { id: "subscription", label: t("tabs.subscription") },
    { id: "emails", label: t("tabs.emails") },
    { id: "peppol", label: t("tabs.peppol") },
    { id: "password", label: t("tabs.password") },
    { id: "data", label: t("tabs.data") },
    { id: "archive", label: t("tabs.archive") },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-gray-600">{t("subtitle")}</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 flex flex-wrap gap-2 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 font-medium border-b-2 transition ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "account" && <AccountTabContent t={t} />}
        {activeTab === "bank" && <BankTabContent t={t} />}
        {activeTab === "tax" && <TaxTabContent t={t} />}
        {activeTab === "template" && <TemplateTabContent t={t} />}
        {activeTab === "subscription" && <SubscriptionTabContent t={t} />}
        {activeTab === "emails" && <EmailTabContent t={t} />}
        {activeTab === "peppol" && <PeppolTabContent t={t} />}
        {activeTab === "password" && <PasswordTabContent t={t} />}
        {activeTab === "data" && <DataTabContent t={t} />}
        {activeTab === "archive" && <ArchiveTabContent t={t} />}
      </div>
    </div>
  );
}

// Sub-components for each tab
function AccountTabContent({ t }: TabContentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("account.title")}</h2>
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t("account.firstName")}
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            placeholder={t("account.lastName")}
            className="px-4 py-2 border rounded"
          />
        </div>
        <input
          type="email"
          placeholder={t("account.email")}
          className="px-4 py-2 border rounded w-full"
        />
        <input
          type="tel"
          placeholder={t("account.phone")}
          className="px-4 py-2 border rounded w-full"
        />
        <input
          type="text"
          placeholder={t("account.companyName")}
          className="px-4 py-2 border rounded w-full"
        />
        <input
          type="text"
          placeholder={t("account.cui")}
          className="px-4 py-2 border rounded w-full"
        />
        <input
          type="email"
          placeholder={t("account.communicationEmail")}
          className="px-4 py-2 border rounded w-full"
        />
        <select className="px-4 py-2 border rounded w-full">
          <option>{t("account.language")}</option>
          <option>English</option>
          <option>Français</option>
          <option>Română</option>
          <option>Nederlands</option>
        </select>
        <select className="px-4 py-2 border rounded w-full">
          <option>{t("account.currency")}</option>
          <option>EUR</option>
          <option>USD</option>
          <option>RON</option>
        </select>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {t("common.save")}
        </button>
      </form>
    </div>
  );
}

function BankTabContent({ t }: TabContentProps) {
  const [data, setData] = useState<BankDetails>({
    bank_name: "",
    account_number: "",
    bic_code: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch<BankDetails>("/preferences/bank");
        setData(result);
      } catch (err) {
        console.error("Failed to load bank details:", err);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await apiFetch("/preferences/bank", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      setSuccess(t("common.saved"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("bank.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("bank.description")}
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder={t("bank.bankName")}
          value={data.bank_name}
          onChange={(e) => setData({ ...data, bank_name: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-900"
        />
        <input
          type="text"
          placeholder={t("bank.accountNumber")}
          value={data.account_number}
          onChange={(e) => setData({ ...data, account_number: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-900"
        />
        <input
          type="text"
          placeholder={t("bank.bicCode")}
          value={data.bic_code}
          onChange={(e) => setData({ ...data, bic_code: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.saving") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

function TaxTabContent({ t }: TabContentProps) {
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [newRate, setNewRate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetch<TaxRate[]>("/preferences/tax-rates");
        setRates(result);
      } catch (err) {
        console.error("Failed to load tax rates:", err);
      }
    }
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!newRate) return;

    setLoading(true);
    try {
      const result = await apiFetch<TaxRate>("/preferences/tax-rates", {
        method: "POST",
        body: JSON.stringify({
          percentage: parseFloat(newRate),
          is_default: false,
        }),
      });
      setRates([...rates, result]);
      setNewRate("");
    } catch (err) {
      console.error("Failed to add tax rate:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/preferences/tax-rates/${id}`, { method: "DELETE" });
      setRates(rates.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Failed to delete tax rate:", err);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("tax.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("tax.description")}
      </p>

      {/* Existing rates */}
      <div className="mb-6 space-y-2">
        {rates.map((rate) => (
          <div
            key={rate.id}
            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded"
          >
            <span className="font-medium">{rate.percentage}%</span>
            <button
              onClick={() => handleDelete(rate.id)}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
            >
              {t("common.delete")}
            </button>
          </div>
        ))}
      </div>

      {/* Add custom rate */}
      <form
        onSubmit={handleAdd}
        className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6"
      >
        <h3 className="font-semibold">{t("tax.custom")}</h3>
        <div className="flex gap-4">
          <input
            type="number"
            placeholder={t("tax.percentage")}
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            min="0"
            max="100"
            step="0.01"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded flex-1 bg-white dark:bg-gray-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("common.adding") : t("common.add")}
          </button>
        </div>
      </form>
    </div>
  );
}

function TemplateTabContent({ t }: TabContentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("template.title")}</h2>
      <div className="space-y-8">
        {/* Logo */}
        <div>
          <h3 className="font-semibold mb-4">{t("template.logo")}</h3>
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-gray-50 cursor-pointer">
            <p>{t("template.logoUpload")}</p>
          </div>
        </div>

        {/* Background */}
        <div>
          <h3 className="font-semibold mb-4">{t("template.background")}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              {t("template.backgroundNone")}
            </button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              {t("template.backgroundDefault1")}
            </button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              {t("template.backgroundDefault2")}
            </button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              {t("template.backgroundDefault3")}
            </button>
          </div>
        </div>

        {/* Font Size */}
        <div>
          <label className="font-semibold block mb-2">
            {t("template.fontSize")}
          </label>
          <select className="px-4 py-2 border rounded">
            <option>{t("template.fontSizeSmall")}</option>
            <option>{t("template.fontSizeMedium")}</option>
            <option>{t("template.fontSizeLarge")}</option>
          </select>
        </div>

        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}

function SubscriptionTabContent({ t }: TabContentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("subscription.title")}</h2>
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-lg mb-2">
          {t("subscription.currentPlan")}
        </h3>
        <p className="text-2xl font-bold mb-4">Professional Plan</p>
        <p className="text-sm text-gray-600 mb-4">Valid until 2026-12-31</p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {t("subscription.upgrade_cta")}
        </button>
      </div>
    </div>
  );
}

function EmailTabContent({ t }: TabContentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("emails.title")}</h2>
      <p className="text-gray-600 mb-6">{t("emails.description")}</p>
      <form className="space-y-4 border p-4 rounded bg-gray-50">
        <input
          type="email"
          placeholder={t("emails.email")}
          className="px-4 py-2 border rounded w-full"
        />
        <input
          type="password"
          placeholder={t("emails.password")}
          className="px-4 py-2 border rounded w-full"
        />
        <input
          type="text"
          placeholder={t("emails.imapHost")}
          className="px-4 py-2 border rounded w-full"
        />
        <input
          type="number"
          placeholder={t("emails.imapPort")}
          className="px-4 py-2 border rounded w-full"
          defaultValue="993"
        />
        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          {t("common.add")}
        </button>
      </form>
    </div>
  );
}

function PeppolTabContent({ t }: TabContentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("peppol.title")}</h2>
      <p className="text-gray-600 mb-6">{t("peppol.description")}</p>

      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded border border-blue-200">
          <h3 className="font-semibold mb-2">{t("peppol.status")}</h3>
          <p className="text-lg font-bold">{t("peppol.statusNotStarted")}</p>
        </div>

        <form className="space-y-4">
          <input
            type="text"
            placeholder={t("peppol.peppolId")}
            className="px-4 py-2 border rounded w-full"
          />
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            {t("peppol.startIntegration")}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordTabContent({ t }: TabContentProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError(t("password.mismatch"));
      return;
    }

    if (newPassword.length < 8) {
      setError(t("password.tooShort"));
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/me/password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setSuccess(t("password.changed"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("password.title")}</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="password"
          placeholder={t("password.current")}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-900"
          required
        />
        <input
          type="password"
          placeholder={t("password.new")}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-900"
          required
        />
        <input
          type="password"
          placeholder={t("password.newConfirm")}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-900"
          required
        />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("password.requirements")}
        </p>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t("common.saving") : t("common.save")}
        </button>
      </form>
    </div>
  );
}

function DataTabContent({ t }: TabContentProps) {
  async function handleDownload() {
    try {
      const data = await apiFetch("/auth/me/data");
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download data:", err);
    }
  }

  async function handleDelete() {
    if (!confirm(t("data.confirmDelete"))) return;

    try {
      await apiFetch("/auth/me", { method: "DELETE" });
      window.location.href = "/";
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("data.title")}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t("data.description")}
      </p>

      <div className="space-y-4 max-w-md">
        <button
          onClick={handleDownload}
          className="w-full bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          {t("data.download")}
        </button>
        <button
          onClick={handleDelete}
          className="w-full bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
        >
          {t("data.delete")}
        </button>
      </div>
    </div>
  );
}

function ArchiveTabContent({ t }: TabContentProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-2">{t("archive.title")}</h2>
      <p className="text-gray-600 mb-6">{t("archive.description")}</p>

      <div className="space-y-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          <input type="date" className="px-4 py-2 border rounded" />
          <input type="date" className="px-4 py-2 border rounded" />
          <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            {t("archive.search")}
          </button>
        </div>

        <div className="text-center py-8 text-gray-600">
          <p>{t("archive.noResults")}</p>
        </div>
      </div>
    </div>
  );
}
