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

  async function save() {
    if (!name.trim() || !unitPrice) {
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
            name,
            code: code || null,
            unit_price: Number(unitPrice),
            vat_rate: Number(vatRate),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-6 space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold">
          {t("edit")} — <span className="opacity-70">{product.name}</span>
        </h2>

        {/* NAME */}
        <div>
          <label className="text-sm opacity-70">{t("name")} *</label>
          <input
            className="w-full rounded-xl border px-3 py-2 bg-transparent
                       border-black/20 dark:border-white/20"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* CODE */}
        <div>
          <label className="text-sm opacity-70">{t("code")}</label>
          <input
            className="w-full rounded-xl border px-3 py-2 bg-transparent
                       border-black/20 dark:border-white/20"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        {/* PRICE */}
        <div>
          <label className="text-sm opacity-70">{t("price")} *</label>
          <input
            type="number"
            className="w-full rounded-xl border px-3 py-2 bg-transparent
                       border-black/20 dark:border-white/20"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>

        {/* VAT */}
        <div>
          <label className="text-sm opacity-70">{t("vat")}</label>
          <input
            type="number"
            className="w-full rounded-xl border px-3 py-2 bg-transparent
                       border-black/20 dark:border-white/20"
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
          />
        </div>

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-black/20 dark:border-white/20"
          >
            Cancel
          </button>

          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-black text-white
                       dark:bg-white dark:text-black disabled:opacity-50"
          >
            {saving ? "…" : t("edit")}
          </button>
        </div>
      </div>
    </div>
  );
}
