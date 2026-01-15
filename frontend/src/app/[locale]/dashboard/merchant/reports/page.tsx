"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../_components/merchantNav";

interface RevenueData {
  period?: string;
  year?: number;
  month?: number;
  week?: number;
  total_revenue: number;
  invoice_count: number;
  avg_invoice: number;
}

interface InvoicesSummary {
  total: { count: number; amount: number };
  paid: { count: number; amount: number };
  pending: { count: number; amount: number };
  overdue: { count: number; amount: number };
}

interface ClientsSummary {
  total_clients: number;
  top_clients: Array<{
    client_id: string;
    client_name: string;
    invoice_count: number;
    total_revenue: number;
  }>;
}

interface TaxSummary {
  total_tax_collected: number;
  total_subtotal: number;
  total_with_tax: number;
}

interface DashboardSummary {
  revenue_last_30_days: number;
  total_invoices: number;
  total_clients: number;
  pending_invoices: number;
  overdue_invoices: number;
}

export default function ReportsPage() {
  const t = useTranslations("reports");
  const nav = useMerchantNav();

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(
    null
  );

  // Revenue data
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [revenueGroupBy, setRevenueGroupBy] = useState<string>("month");
  const [revenueStartDate, setRevenueStartDate] = useState("");
  const [revenueEndDate, setRevenueEndDate] = useState("");

  // Invoices summary
  const [invoicesSummary, setInvoicesSummary] =
    useState<InvoicesSummary | null>(null);
  const [invoicesStartDate, setInvoicesStartDate] = useState("");
  const [invoicesEndDate, setInvoicesEndDate] = useState("");

  // Clients summary
  const [clientsSummary, setClientsSummary] = useState<ClientsSummary | null>(
    null
  );

  // Tax summary
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [taxStartDate, setTaxStartDate] = useState("");
  const [taxEndDate, setTaxEndDate] = useState("");

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/reports/dashboard`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load dashboard");
      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadRevenueReport() {
    setLoading(true);
    setError("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const params = new URLSearchParams({
        group_by: revenueGroupBy,
      });
      if (revenueStartDate) params.append("start_date", revenueStartDate);
      if (revenueEndDate) params.append("end_date", revenueEndDate);

      const res = await fetch(`${base}/reports/revenue?${params}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load revenue");
      const data = await res.json();
      setRevenueData(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadInvoicesSummary() {
    setLoading(true);
    setError("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const params = new URLSearchParams();
      if (invoicesStartDate) params.append("start_date", invoicesStartDate);
      if (invoicesEndDate) params.append("end_date", invoicesEndDate);

      const res = await fetch(`${base}/reports/invoices-summary?${params}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoicesSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadClientsSummary() {
    setLoading(true);
    setError("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/reports/clients-summary`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load clients");
      const data = await res.json();
      setClientsSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function loadTaxSummary() {
    setLoading(true);
    setError("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const params = new URLSearchParams();
      if (taxStartDate) params.append("start_date", taxStartDate);
      if (taxEndDate) params.append("end_date", taxEndDate);

      const res = await fetch(`${base}/reports/tax-summary?${params}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to load tax");
      const data = await res.json();
      setTaxSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const tabs = [
    { id: "dashboard", label: t("tabs.dashboard") },
    { id: "revenue", label: t("tabs.revenue") },
    { id: "invoices", label: t("tabs.invoices") },
    { id: "clients", label: t("tabs.clients") },
    { id: "tax", label: t("tabs.tax") },
  ];

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="w-full">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{t("subtitle")}</p>

        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-2 border-b border-black/10 dark:border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium border-b-2 transition ${
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
          {activeTab === "dashboard" && (
            <DashboardTab
              t={t}
              data={dashboardData}
              loading={loading}
              onRefresh={loadDashboardData}
            />
          )}
          {activeTab === "revenue" && (
            <RevenueTab
              t={t}
              data={revenueData}
              loading={loading}
              groupBy={revenueGroupBy}
              setGroupBy={setRevenueGroupBy}
              startDate={revenueStartDate}
              setStartDate={setRevenueStartDate}
              endDate={revenueEndDate}
              setEndDate={setRevenueEndDate}
              onLoad={loadRevenueReport}
            />
          )}
          {activeTab === "invoices" && (
            <InvoicesTab
              t={t}
              data={invoicesSummary}
              loading={loading}
              startDate={invoicesStartDate}
              setStartDate={setInvoicesStartDate}
              endDate={invoicesEndDate}
              setEndDate={setInvoicesEndDate}
              onLoad={loadInvoicesSummary}
            />
          )}
          {activeTab === "clients" && (
            <ClientsTab
              t={t}
              data={clientsSummary}
              loading={loading}
              onLoad={loadClientsSummary}
            />
          )}
          {activeTab === "tax" && (
            <TaxTab
              t={t}
              data={taxSummary}
              loading={loading}
              startDate={taxStartDate}
              setStartDate={setTaxStartDate}
              endDate={taxEndDate}
              setEndDate={setTaxEndDate}
              onLoad={loadTaxSummary}
            />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

type TranslationFn = (key: string) => string;

// Dashboard Tab
function DashboardTab({
  t,
  data,
  loading,
  onRefresh,
}: {
  t: TranslationFn;
  data: DashboardSummary | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  useEffect(() => {
    if (!data) onRefresh();
  }, [data, onRefresh]);

  if (loading) return <div className="p-8 text-center">{t("loading")}</div>;
  if (!data) return null;

  const cards = [
    {
      title: t("dashboard.revenue30d"),
      value: `€${data.revenue_last_30_days.toFixed(2)}`,
      color: "bg-blue-500",
    },
    {
      title: t("dashboard.totalInvoices"),
      value: data.total_invoices,
      color: "bg-green-500",
    },
    {
      title: t("dashboard.totalClients"),
      value: data.total_clients,
      color: "bg-purple-500",
    },
    {
      title: t("dashboard.pendingInvoices"),
      value: data.pending_invoices,
      color: "bg-yellow-500",
    },
    {
      title: t("dashboard.overdueInvoices"),
      value: data.overdue_invoices,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-black/10 dark:border-white/10"
          >
            <div
              className={`inline-block p-3 rounded-lg ${card.color} text-white mb-4`}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {card.title}
            </h3>
            <p className="text-3xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Revenue Tab
function RevenueTab({
  t,
  data,
  loading,
  groupBy,
  setGroupBy,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onLoad,
}: {
  t: TranslationFn;
  data: RevenueData[];
  loading: boolean;
  groupBy: string;
  setGroupBy: (v: string) => void;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onLoad: () => void;
}) {
  const formatPeriod = (row: RevenueData) => {
    if (row.period) return row.period;
    if (groupBy === "week") return `${row.year}-W${row.week}`;
    if (groupBy === "month")
      return `${row.year}-${String(row.month).padStart(2, "0")}`;
    if (groupBy === "year") return String(row.year);
    return "N/A";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("revenue.title")}</h2>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm mb-2">{t("revenue.groupBy")}</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          >
            <option value="day">{t("revenue.day")}</option>
            <option value="week">{t("revenue.week")}</option>
            <option value="month">{t("revenue.month")}</option>
            <option value="year">{t("revenue.year")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2">{t("revenue.startDate")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">{t("revenue.endDate")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onLoad}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("loading") : t("revenue.generate")}
          </button>
        </div>
      </div>

      {/* Results */}
      {data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-black/10 dark:border-white/10">
              <tr>
                <th className="text-left py-3 px-4">{t("revenue.period")}</th>
                <th className="text-right py-3 px-4">
                  {t("revenue.totalRevenue")}
                </th>
                <th className="text-right py-3 px-4">
                  {t("revenue.invoiceCount")}
                </th>
                <th className="text-right py-3 px-4">
                  {t("revenue.avgInvoice")}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row: RevenueData, i: number) => (
                <tr
                  key={i}
                  className="border-b border-black/10 dark:border-white/10"
                >
                  <td className="py-3 px-4">{formatPeriod(row)}</td>
                  <td className="text-right py-3 px-4">
                    €{row.total_revenue.toFixed(2)}
                  </td>
                  <td className="text-right py-3 px-4">{row.invoice_count}</td>
                  <td className="text-right py-3 px-4">
                    €{row.avg_invoice.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Invoices Tab
function InvoicesTab({
  t,
  data,
  loading,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onLoad,
}: {
  t: TranslationFn;
  data: InvoicesSummary | null;
  loading: boolean;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onLoad: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("invoices.title")}</h2>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-2">
            {t("invoices.startDate")}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">{t("invoices.endDate")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onLoad}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("loading") : t("invoices.generate")}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-black/10 dark:border-white/10 rounded">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("invoices.total")}
            </h3>
            <p className="text-2xl font-bold">{data.total.count}</p>
            <p className="text-sm text-gray-500">
              €{data.total.amount.toFixed(2)}
            </p>
          </div>
          <div className="p-4 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("invoices.paid")}
            </h3>
            <p className="text-2xl font-bold text-green-600">
              {data.paid.count}
            </p>
            <p className="text-sm text-green-600">
              €{data.paid.amount.toFixed(2)}
            </p>
          </div>
          <div className="p-4 border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("invoices.pending")}
            </h3>
            <p className="text-2xl font-bold text-yellow-600">
              {data.pending.count}
            </p>
            <p className="text-sm text-yellow-600">
              €{data.pending.amount.toFixed(2)}
            </p>
          </div>
          <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("invoices.overdue")}
            </h3>
            <p className="text-2xl font-bold text-red-600">
              {data.overdue.count}
            </p>
            <p className="text-sm text-red-600">
              €{data.overdue.amount.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Clients Tab
function ClientsTab({
  t,
  data,
  loading,
  onLoad,
}: {
  t: TranslationFn;
  data: ClientsSummary | null;
  loading: boolean;
  onLoad: () => void;
}) {
  useEffect(() => {
    if (!data) onLoad();
  }, [data, onLoad]);

  if (loading) return <div className="p-8 text-center">{t("loading")}</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("clients.title")}</h2>

      {data && (
        <>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <h3 className="text-lg font-semibold mb-2">
              {t("clients.totalClients")}
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {data.total_clients}
            </p>
          </div>

          <h3 className="text-xl font-bold mb-4">{t("clients.topClients")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-black/10 dark:border-white/10">
                <tr>
                  <th className="text-left py-3 px-4">
                    {t("clients.clientName")}
                  </th>
                  <th className="text-right py-3 px-4">
                    {t("clients.invoiceCount")}
                  </th>
                  <th className="text-right py-3 px-4">
                    {t("clients.totalRevenue")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.top_clients.map((client, i) => (
                  <tr
                    key={i}
                    className="border-b border-black/10 dark:border-white/10"
                  >
                    <td className="py-3 px-4">{client.client_name}</td>
                    <td className="text-right py-3 px-4">
                      {client.invoice_count}
                    </td>
                    <td className="text-right py-3 px-4">
                      €{client.total_revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// Tax Tab
function TaxTab({
  t,
  data,
  loading,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onLoad,
}: {
  t: TranslationFn;
  data: TaxSummary | null;
  loading: boolean;
  startDate: string;
  setStartDate: (v: string) => void;
  endDate: string;
  setEndDate: (v: string) => void;
  onLoad: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">{t("tax.title")}</h2>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm mb-2">{t("tax.startDate")}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
        </div>
        <div>
          <label className="block text-sm mb-2">{t("tax.endDate")}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-black/10 dark:border-white/10 rounded bg-white dark:bg-black/20"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={onLoad}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? t("loading") : t("tax.generate")}
          </button>
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border border-black/10 dark:border-white/10 rounded">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("tax.totalSubtotal")}
            </h3>
            <p className="text-2xl font-bold">
              €{data.total_subtotal.toFixed(2)}
            </p>
          </div>
          <div className="p-6 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("tax.totalTaxCollected")}
            </h3>
            <p className="text-2xl font-bold text-blue-600">
              €{data.total_tax_collected.toFixed(2)}
            </p>
          </div>
          <div className="p-6 border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded">
            <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("tax.totalWithTax")}
            </h3>
            <p className="text-2xl font-bold text-green-600">
              €{data.total_with_tax.toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
