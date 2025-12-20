"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function AddProductModal({ onClose, onCreated }: Props) {
  const t = useTranslations("products");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const [vat, setVat] = useState("21");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded-xl border border-black/20 dark:border-white/20 px-3 py-2 " +
    "bg-white dark:bg-black text-black dark:text-white " +
    "focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30";

  async function submit() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code: code || null,
          unit_price: Number(price),
          vat_rate: Number(vat),
        }),
      });

      if (!res.ok) {
        throw new Error();
      }

      onCreated();
      onClose();
    } catch {
      setError(t("errorSave"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-black p-6 space-y-4">
        <h2 className="text-lg font-semibold">{t("add")}</h2>

        <input
          className={inputClass}
          placeholder={t("name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className={inputClass}
          placeholder={t("code")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <input
          className={inputClass}
          placeholder={t("price")}
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <input
          className={inputClass}
          placeholder={t("vat")}
          type="number"
          value={vat}
          onChange={(e) => setVat(e.target.value)}
        />

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-black/20 dark:border-white/20"
          >
            {t("cancel")}
          </button>

          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
          >
            {loading ? "…" : t("add")}
          </button>
        </div>
      </div>
    </div>
  );
}
