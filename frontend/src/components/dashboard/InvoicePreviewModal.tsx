"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface InvoicePreviewModalProps {
  invoiceId: number;
  invoiceNo: string;
  clientEmail?: string;
  onClose: () => void;
}

interface MerchantEmails {
  communication_email: string;
  client_invoices_email: string;
  supplier_invoices_email: string;
}

export default function InvoicePreviewModal({
  invoiceId,
  invoiceNo,
  clientEmail,
  onClose,
}: InvoicePreviewModalProps) {
  const t = useTranslations("dashboard.invoices");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Send email state
  const [showSendModal, setShowSendModal] = useState(false);
  const [merchantEmails, setMerchantEmails] = useState<MerchantEmails | null>(
    null
  );
  const [selectedFromEmail, setSelectedFromEmail] = useState("");
  const [toEmail, setToEmail] = useState(clientEmail || "");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    async function loadPdf() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "/api";

        const res = await fetch(`${base}/invoices/${invoiceId}/pdf`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to load PDF");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load invoice");
      } finally {
        setLoading(false);
      }
    }

    loadPdf();

    // Cleanup function
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]); // pdfUrl is intentionally excluded - it's managed by the effect itself

  // Load merchant emails when send modal opens
  useEffect(() => {
    if (!showSendModal) return;

    async function loadMerchantEmails() {
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "/api";

        const res = await fetch(`${base}/preferences/account`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setMerchantEmails({
            communication_email: data.communication_email || "",
            client_invoices_email: data.client_invoices_email || "",
            supplier_invoices_email: data.supplier_invoices_email || "",
          });
          // Default to client invoices email if available, else communication email
          setSelectedFromEmail(
            data.client_invoices_email || data.communication_email || ""
          );
        }
      } catch (e) {
        console.error("Failed to load merchant emails:", e);
      }
    }

    loadMerchantEmails();
  }, [showSendModal]);

  async function handleSendEmail() {
    if (!selectedFromEmail || !toEmail) return;

    setSending(true);
    setSendError("");

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/invoices/${invoiceId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          from_email: selectedFromEmail,
          to_email: toEmail,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to send email");
      }

      setSendSuccess(true);
      setTimeout(() => {
        setShowSendModal(false);
        setSendSuccess(false);
      }, 2000);
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : "Failed to send email");
    } finally {
      setSending(false);
    }
  }

  async function handleDownload() {
    if (!pdfUrl) return;

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${invoiceNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {t("previewTitle")} {invoiceNo}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {t("previewSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {pdfUrl && (
              <>
                <button
                  onClick={() => setShowSendModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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
                  {t("sendEmail")}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {t("downloadPdf")}
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-6 h-6 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400">
                  {t("loadingPdf")}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <p className="text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            </div>
          )}

          {pdfUrl && !loading && !error && (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Invoice ${invoiceNo}`}
            />
          )}
        </div>
      </div>

      {/* Send Email Modal */}
      {showSendModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowSendModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t("sendEmailTitle")}
            </h3>

            {sendSuccess ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-5xl mb-4">✓</div>
                <p className="text-green-600 dark:text-green-400 font-medium">
                  {t("emailSentSuccess")}
                </p>
              </div>
            ) : (
              <>
                {sendError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm">
                    {sendError}
                  </div>
                )}

                <div className="space-y-4">
                  {/* From Email Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("fromEmail")}
                    </label>
                    <select
                      value={selectedFromEmail}
                      onChange={(e) => setSelectedFromEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">{t("selectEmail")}</option>
                      {merchantEmails?.client_invoices_email && (
                        <option value={merchantEmails.client_invoices_email}>
                          {t("clientInvoicesEmailOption")} -{" "}
                          {merchantEmails.client_invoices_email}
                        </option>
                      )}
                      {merchantEmails?.communication_email && (
                        <option value={merchantEmails.communication_email}>
                          {t("communicationEmailOption")} -{" "}
                          {merchantEmails.communication_email}
                        </option>
                      )}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("fromEmailHelp")}
                    </p>
                  </div>

                  {/* To Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("toEmail")}
                    </label>
                    <input
                      type="email"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      placeholder={t("toEmailPlaceholder")}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("toEmailHelp")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    onClick={handleSendEmail}
                    disabled={sending || !selectedFromEmail || !toEmail}
                    className="flex-1 px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? t("sending") : t("send")}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
