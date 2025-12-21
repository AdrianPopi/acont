"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Product } from "./types";

type Props = {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditProductModal({ product, onClose, onSaved }: Props) {
  const t = useTranslations("products");

  const [name, setName] = useState(product.name);
  const [code, setCode] = useState(product.code || "");
  const [unitPrice, setUnitPrice] = useState(String(product.unit_price));
  const [vatRate, setVatRate] = useState(String(product.vat_rate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full rounded-xl border px-3 py-2 " +
    "bg-white text-black border-black/20 " +
    "dark:bg-neutral-900 dark:text-white dark:border-white/20 " +
    "focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30";

  async function save() {
    const price = Number(unitPrice);
    const vat = Number(vatRate);

    if (!name.trim() || isNaN(price)) {
      setError("Completează câmpurile obligatorii");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products/${product.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            code: code?.trim() || null,
            unit_price: price,
            vat_rate: isNaN(vat) ? 0 : vat,
          }),
        }
      );

      if (!res.ok) throw new Error();

      onSaved();
    } catch {
      setError("Eroare la salvare");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          {t("edit")} — <span className="opacity-70">{product.name}</span>
        </h2>

        {/* NAME */}
        <div>
          <label className="text-sm opacity-70">{t("name")} *</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* CODE */}
        <div>
          <label className="text-sm opacity-70">{t("code")}</label>
          <input
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        {/* PRICE */}
        <div>
          <label className="text-sm opacity-70">{t("price")} *</label>
          <input
            type="number"
            className={inputClass}
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>

        {/* VAT */}
        <div>
          <label className="text-sm opacity-70">{t("vat")}</label>
          <input
            type="number"
            placeholder={`${t("vat")} (%)`}
            className={inputClass}
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="
              px-4 py-2 rounded-xl
              border border-black/30 dark:border-white/30
              bg-white text-black
              dark:bg-neutral-900 dark:text-white
            "
          >
            {t("cancel")}
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="
              px-4 py-2 rounded-xl
              bg-black text-white
              dark:bg-white dark:text-black
              disabled:opacity-50
            "
          >
            {saving ? "…" : t("edit")}
          </button>
        </div>
      </div>
    </div>
  );
}
