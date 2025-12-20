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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
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
        <thead className="opacity-70">
          <tr>
            <th>{t("name")}</th>
            <th>{t("code")}</th>
            <th>{t("price")}</th>
            <th>{t("vat")}</th>
            <th className="text-right">{t("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t">
              <td>{p.name}</td>
              <td>{p.code || "-"}</td>
              <td>{p.unit_price} €</td>
              <td>{p.vat_rate}%</td>
              <td className="text-right space-x-2">
                <button
                  onClick={() => setEditing(p)}
                  className="text-blue-500 hover:underline"
                >
                  {t("edit")}
                </button>
                <button
                  disabled={loadingId === p.id}
                  onClick={() => remove(p.id)}
                  className="text-red-500 hover:underline"
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
