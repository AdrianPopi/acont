"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

type Props = {
  onClose: () => void;
  onImported: () => void;
};

type ImportResult = {
  ok?: boolean;
  created?: number;
  updated?: number;
  failed?: number;
  errors?: Array<{ row: number; error: string }>;
  detail?: string;
};

function parseErrorText(text: string) {
  try {
    const j = JSON.parse(text);
    return j.detail || j.message || text;
  } catch {
    return text;
  }
}

// Excel friendly CSV (BOM + \r\n)
function downloadTemplateCsv(filename: string) {
  const headers = ["name", "code", "description", "unit_price", "vat_rate"];

  const exampleRow = [
    "Servicii consultanță",
    "CONS-001",
    "Consultanță contabilă",
    "120.00",
    "19",
  ];

  const escapeCsv = (v: string) => {
    // wrap in quotes and escape quotes
    const s = String(v ?? "");
    return `"${s.replace(/"/g, '""')}"`;
  };

  const lines = [
    headers.map(escapeCsv).join(","),
    exampleRow.map(escapeCsv).join(","),
  ];

  // BOM for Excel
  const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ImportProductsCsvModal({ onClose, onImported }: Props) {
  const t = useTranslations("products");

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const containerClass =
    "w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-xl " +
    "bg-white text-black border border-black/10 " +
    "dark:bg-neutral-900 dark:text-white dark:border-white/10";

  const inputClass =
    "w-full rounded-xl border px-3 py-2 " +
    "bg-white text-black border-black/20 " +
    "dark:bg-neutral-900 dark:text-white dark:border-white/20 " +
    "focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30";

  async function upload() {
    if (!file) {
      setError(t("csvChoose"));
      return;
    }

    try {
      setUploading(true);
      setError("");
      setResult(null);

      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/upload-csv`,
        {
          method: "POST",
          credentials: "include",
          body: form,
        }
      );

      const text = await res.text();

      if (!res.ok) {
        setError(parseErrorText(text) || t("errorSave"));
        return;
      }

      const data = (text ? JSON.parse(text) : {}) as ImportResult;
      setResult(data);

      onImported();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setError(e?.message || t("errorSave"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div className={containerClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{t("importCsv")}</h2>
            <p className="text-sm opacity-70 mt-1">
              CSV: <code>name,code,description,unit_price,vat_rate</code>
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl px-3 py-2 border border-black/20 dark:border-white/20 hover:opacity-90"
            aria-label={t("cancel")}
          >
            ✕
          </button>
        </div>

        {/* Actions top */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => downloadTemplateCsv("products_template.csv")}
            className="rounded-xl border border-black/20 dark:border-white/20 px-4 py-2 text-sm hover:opacity-90"
          >
            {t("csvDownloadTemplate")}
          </button>

          <div className="text-xs opacity-70">{t("csvTemplateHint")}</div>
        </div>

        {/* File picker */}
        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className={inputClass}
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setFile(f);
              setError("");
              setResult(null);
            }}
          />

          <div className="text-xs opacity-70">
            {file ? (
              <>
                <span className="font-medium">{file.name}</span>{" "}
                <span>({Math.round(file.size / 1024)} KB)</span>
              </>
            ) : (
              <span>{t("csvChoose")}</span>
            )}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-2">
            <div className="font-medium">{t("csvResult")}</div>

            <div className="text-sm opacity-80">
              {t("csvCreated")}:{" "}
              <span className="font-semibold">{result.created ?? 0}</span> •{" "}
              {t("csvUpdated")}:{" "}
              <span className="font-semibold">{result.updated ?? 0}</span> •{" "}
              {t("csvFailed")}:{" "}
              <span className="font-semibold">{result.failed ?? 0}</span>
            </div>

            {!!result.errors?.length && (
              <div className="text-sm mt-2 space-y-1 max-h-40 overflow-auto">
                {result.errors.slice(0, 50).map((e, idx) => (
                  <div key={idx} className="text-red-600 dark:text-red-400">
                    {t("csvRow")} {e.row}: {e.error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <div className="text-red-500 text-sm">{error}</div>}

        {/* Actions bottom */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-black/30 dark:border-white/30 bg-white text-black dark:bg-neutral-900 dark:text-white"
          >
            {t("cancel")}
          </button>

          <button
            onClick={upload}
            disabled={uploading}
            className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
          >
            {uploading ? "…" : t("csvUpload")}
          </button>
        </div>
      </div>
    </div>
  );
}
