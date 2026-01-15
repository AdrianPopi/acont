"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../_components/merchantNav";

type Supplier = {
  id: number;
  name: string;
  email: string | null;
  tax_id: string | null;
  address: string | null;
  peppol_id: string | null;
  phone: string | null;
  contact_person: string | null;
};

type SupplierInvoice = {
  id: number;
  supplier_id: number | null;
  supplier_name: string | null;
  invoice_no: string;
  issue_date: string;
  due_date: string | null;
  total_gross: string;
  status: string;
  source: string;
  pdf_filename: string | null;
};

export default function SuppliersPage() {
  const t = useTranslations("dashboard.suppliers");
  const nav = useMerchantNav();
  const base = process.env.NEXT_PUBLIC_API_URL || "/api";

  // Tab state
  const [activeTab, setActiveTab] = useState<"suppliers" | "invoices">(
    "invoices"
  );

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Invoices state
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);

  // Modal states
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state for supplier
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    email: "",
    tax_id: "",
    address: "",
    peppol_id: "",
    phone: "",
    contact_person: "",
  });

  // Form state for upload
  const [uploadForm, setUploadForm] = useState({
    supplier_id: "",
    invoice_no: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    total_net: "",
    total_vat: "",
    total_gross: "",
    description: "",
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingPeppol, setFetchingPeppol] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load suppliers
  const loadSuppliers = useCallback(async () => {
    setLoadingSuppliers(true);
    try {
      const res = await fetch(`${base}/suppliers`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load suppliers");
      const data = await res.json();
      setSuppliers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSuppliers(false);
    }
  }, [base]);

  // Load invoices
  const loadInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const res = await fetch(`${base}/suppliers/invoices/all`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInvoices(false);
    }
  }, [base]);

  useEffect(() => {
    loadSuppliers();
    loadInvoices();
  }, [loadSuppliers, loadInvoices]);

  // Fetch from PEPPOL
  async function handleFetchPeppol() {
    setFetchingPeppol(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${base}/suppliers/peppol/fetch`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        loadInvoices();
        loadSuppliers();
      } else {
        setError(data.detail || "Failed to fetch from PEPPOL");
      }
    } catch {
      setError("Connection error");
    } finally {
      setFetchingPeppol(false);
    }
  }

  // Save supplier
  async function handleSaveSupplier() {
    if (!supplierForm.name.trim()) {
      setError(t("errorNameRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = editingSupplier
        ? `${base}/suppliers/${editingSupplier.id}`
        : `${base}/suppliers`;
      const method = editingSupplier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      setShowSupplierModal(false);
      setEditingSupplier(null);
      setSupplierForm({
        name: "",
        email: "",
        tax_id: "",
        address: "",
        peppol_id: "",
        phone: "",
        contact_person: "",
      });
      loadSuppliers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error saving supplier");
    } finally {
      setSaving(false);
    }
  }

  // Delete supplier
  async function handleDeleteSupplier(id: number) {
    if (!confirm(t("confirmDelete"))) return;
    try {
      const res = await fetch(`${base}/suppliers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      loadSuppliers();
    } catch {
      setError("Failed to delete supplier");
    }
  }

  // Upload invoice
  async function handleUploadInvoice() {
    if (!uploadFile) {
      setError(t("errorFileRequired"));
      return;
    }
    if (!uploadForm.invoice_no.trim()) {
      setError(t("errorInvoiceNoRequired"));
      return;
    }
    if (!uploadForm.total_gross.trim()) {
      setError(t("errorTotalRequired"));
      return;
    }

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("invoice_no", uploadForm.invoice_no);
      formData.append("issue_date", uploadForm.issue_date);
      if (uploadForm.due_date) formData.append("due_date", uploadForm.due_date);
      if (uploadForm.supplier_id)
        formData.append("supplier_id", uploadForm.supplier_id);
      formData.append("total_net", uploadForm.total_net || "0.00");
      formData.append("total_vat", uploadForm.total_vat || "0.00");
      formData.append("total_gross", uploadForm.total_gross);
      if (uploadForm.description)
        formData.append("description", uploadForm.description);

      const res = await fetch(`${base}/suppliers/invoices/upload`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt);
      }

      setShowUploadModal(false);
      setUploadFile(null);
      setUploadForm({
        supplier_id: "",
        invoice_no: "",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: "",
        total_net: "",
        total_vat: "",
        total_gross: "",
        description: "",
      });
      loadInvoices();
      setSuccess(t("uploadSuccess"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Download PDF
  async function handleDownloadPdf(invoiceId: number, filename: string | null) {
    try {
      const res = await fetch(`${base}/suppliers/invoices/${invoiceId}/pdf`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("PDF not found");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `invoice_${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download PDF");
    }
  }

  // Delete invoice
  async function handleDeleteInvoice(id: number) {
    if (!confirm(t("confirmDeleteInvoice"))) return;
    try {
      const res = await fetch(`${base}/suppliers/invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      loadInvoices();
    } catch {
      setError("Failed to delete invoice");
    }
  }

  // Edit supplier
  function openEditSupplier(supplier: Supplier) {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      email: supplier.email || "",
      tax_id: supplier.tax_id || "",
      address: supplier.address || "",
      peppol_id: supplier.peppol_id || "",
      phone: supplier.phone || "",
      contact_person: supplier.contact_person || "",
    });
    setShowSupplierModal(true);
  }

  // Status badge color
  function getStatusColor(status: string) {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "validated":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "disputed":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }

  // Source badge
  function getSourceBadge(source: string) {
    if (source === "peppol") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
          PEPPOL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
        {t("manual")}
      </span>
    );
  }

  const invoiceStats = useMemo(() => {
    const total = invoices.length;
    const peppolCount = invoices.filter((i) => i.source === "peppol").length;
    const totalAmount = invoices.reduce(
      (sum, i) => sum + parseFloat(i.total_gross || "0"),
      0
    );
    return { total, peppolCount, totalAmount };
  }, [invoices]);

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("subtitle")}
            </p>
          </div>
          <button
            onClick={handleFetchPeppol}
            disabled={fetchingPeppol}
            className="flex items-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-sm text-white font-medium shadow-sm transition disabled:opacity-50"
          >
            {fetchingPeppol ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {t("fetchingPeppol")}
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                {t("fetchPeppol")}
              </>
            )}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("totalInvoices")}
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              {invoiceStats.total}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("peppolInvoices")}
            </div>
            <div className="mt-1 text-2xl font-semibold text-purple-600 dark:text-purple-400">
              {invoiceStats.peppolCount}
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("totalAmount")}
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
              €{invoiceStats.totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
            <button onClick={() => setError("")} className="float-right">
              ×
            </button>
          </div>
        )}
        {success && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-600 dark:text-green-400">
            {success}
            <button onClick={() => setSuccess("")} className="float-right">
              ×
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === "invoices"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t("tabInvoices")}
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${
              activeTab === "suppliers"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {t("tabSuppliers")}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "invoices" && (
          <div className="space-y-4">
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 py-2.5 text-sm text-black font-medium shadow-glow hover:opacity-90"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {t("uploadInvoice")}
              </button>
            </div>

            {/* Invoices Table */}
            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 overflow-hidden">
              {loadingInvoices ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {t("loading")}
                </div>
              ) : invoices.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  {t("noInvoices")}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                          {t("colInvoiceNo")}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                          {t("colSupplier")}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 hidden sm:table-cell">
                          {t("colIssueDate")}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                          {t("colTotal")}
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 hidden md:table-cell">
                          {t("colSource")}
                        </th>
                        <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                          {t("colStatus")}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                          {t("colActions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                        >
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {inv.invoice_no}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                            {inv.supplier_name || (
                              <span className="text-gray-400 italic">
                                {t("unknownSupplier")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                            {inv.issue_date}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                            €{parseFloat(inv.total_gross || "0").toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center hidden md:table-cell">
                            {getSourceBadge(inv.source)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                inv.status
                              )}`}
                            >
                              {t(`status_${inv.status}`)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {inv.pdf_filename && (
                                <button
                                  onClick={() =>
                                    handleDownloadPdf(inv.id, inv.pdf_filename)
                                  }
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                                  title={t("downloadPdf")}
                                >
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                                title={t("delete")}
                              >
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="space-y-4">
            {/* Action buttons */}
            <div>
              <button
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierForm({
                    name: "",
                    email: "",
                    tax_id: "",
                    address: "",
                    peppol_id: "",
                    phone: "",
                    contact_person: "",
                  });
                  setShowSupplierModal(true);
                }}
                className="flex items-center gap-2 rounded-2xl bg-brand-gradient px-4 py-2.5 text-sm text-black font-medium shadow-glow hover:opacity-90"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {t("addSupplier")}
              </button>
            </div>

            {/* Suppliers Grid */}
            {loadingSuppliers ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t("loading")}
              </div>
            ) : suppliers.length === 0 ? (
              <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
                {t("noSuppliers")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suppliers.map((sup) => (
                  <div
                    key={sup.id}
                    className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {sup.name}
                        </h3>
                        {sup.peppol_id && (
                          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                            PEPPOL: {sup.peppol_id}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => openEditSupplier(sup)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(sup.id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {sup.email && (
                        <div className="flex items-center gap-2 truncate">
                          <svg
                            className="h-4 w-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="truncate">{sup.email}</span>
                        </div>
                      )}
                      {sup.tax_id && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span>{sup.tax_id}</span>
                        </div>
                      )}
                      {sup.phone && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>{sup.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingSupplier ? t("editSupplier") : t("addSupplier")}
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("supplierName")} *
                  </label>
                  <input
                    type="text"
                    value={supplierForm.name}
                    onChange={(e) =>
                      setSupplierForm({ ...supplierForm, name: e.target.value })
                    }
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      value={supplierForm.email}
                      onChange={(e) =>
                        setSupplierForm({
                          ...supplierForm,
                          email: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("phone")}
                    </label>
                    <input
                      type="text"
                      value={supplierForm.phone}
                      onChange={(e) =>
                        setSupplierForm({
                          ...supplierForm,
                          phone: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("taxId")}
                    </label>
                    <input
                      type="text"
                      value={supplierForm.tax_id}
                      onChange={(e) =>
                        setSupplierForm({
                          ...supplierForm,
                          tax_id: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("peppolId")}
                    </label>
                    <input
                      type="text"
                      value={supplierForm.peppol_id}
                      onChange={(e) =>
                        setSupplierForm({
                          ...supplierForm,
                          peppol_id: e.target.value,
                        })
                      }
                      placeholder="0208:..."
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("address")}
                  </label>
                  <textarea
                    value={supplierForm.address}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        address: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("contactPerson")}
                  </label>
                  <input
                    type="text"
                    value={supplierForm.contact_person}
                    onChange={(e) =>
                      setSupplierForm({
                        ...supplierForm,
                        contact_person: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowSupplierModal(false);
                    setEditingSupplier(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleSaveSupplier}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? t("saving") : t("save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Invoice Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("uploadInvoice")}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("uploadInvoiceHint")}
              </p>
              <div className="mt-4 space-y-4">
                {/* File upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("pdfFile")} *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) =>
                        setUploadFile(e.target.files?.[0] || null)
                      }
                      className="hidden"
                      id="pdf-upload"
                    />
                    <label
                      htmlFor="pdf-upload"
                      className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {uploadFile ? uploadFile.name : t("selectPdf")}
                    </label>
                  </div>
                </div>

                {/* Supplier select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("supplier")}
                  </label>
                  <select
                    value={uploadForm.supplier_id}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        supplier_id: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t("selectSupplier")}</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("invoiceNo")} *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.invoice_no}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          invoice_no: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("issueDate")} *
                    </label>
                    <input
                      type="date"
                      value={uploadForm.issue_date}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          issue_date: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("totalNet")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={uploadForm.total_net}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          total_net: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("totalVat")}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={uploadForm.total_vat}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          total_vat: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("totalGross")} *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={uploadForm.total_gross}
                      onChange={(e) =>
                        setUploadForm({
                          ...uploadForm,
                          total_gross: e.target.value,
                        })
                      }
                      placeholder="0.00"
                      className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("description")}
                  </label>
                  <input
                    type="text"
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadFile(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={handleUploadInvoice}
                  disabled={uploading}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? t("uploading") : t("upload")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
