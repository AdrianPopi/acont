"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Product } from "./types";
import EditProductModal from "./EditProductModal";

type Props = {
  products: Product[];
  onChanged: () => void;
};

export default function ProductsTable({ products, onChanged }: Props) {
  const t = useTranslations("products");
  const [editing, setEditing] = useState<Product | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function remove(id: number) {
    if (!confirm(t("confirmDelete"))) return;

    try {
      setLoadingId(id);
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      await fetch(`${base}/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      onChanged();
    } finally {
      setLoadingId(null);
    }
  }

  if (!products.length) {
    return <div className="opacity-60">{t("empty")}</div>;
  }

  return (
    <>
      <table className="w-full text-sm">
        <thead className="opacity-70 border-b">
          <tr>
            <th className="text-left py-2">{t("name")}</th>
            <th className="text-left">{t("code")}</th>
            <th className="text-left">{t("price")}</th>
            <th className="text-left">{t("vat")}</th>
            <th className="text-right">{t("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t align-top">
              {/* NAME */}
              <td className="py-4">
                <div className="flex flex-col">
                  <span className="text-xs opacity-60">{t("name")}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
              </td>

              {/* CODE */}
              <td className="py-4">
                <div className="flex flex-col">
                  <span className="text-xs opacity-60">{t("code")}</span>
                  <span>{p.code || "-"}</span>
                </div>
              </td>

              {/* PRICE */}
              <td className="py-4">
                <div className="flex flex-col">
                  <span className="text-xs opacity-60">{t("price")}</span>
                  <span>{Number(p.unit_price).toFixed(2)} €</span>
                </div>
              </td>

              {/* VAT */}
              <td className="py-4">
                <div className="flex flex-col">
                  <span className="text-xs opacity-60">{t("vat")}</span>
                  <span>{Number(p.vat_rate)}%</span>
                </div>
              </td>

              {/* ACTIONS */}
              <td className="py-4 text-right space-x-3">
                <button
                  onClick={() => setEditing(p)}
                  className="text-blue-500 hover:underline"
                >
                  {t("edit")}
                </button>

                <button
                  disabled={loadingId === p.id}
                  onClick={() => remove(p.id)}
                  className="text-red-500 hover:underline disabled:opacity-40"
                >
                  {t("delete")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editing && (
        <EditProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onChanged();
          }}
        />
      )}
    </>
  );
}
