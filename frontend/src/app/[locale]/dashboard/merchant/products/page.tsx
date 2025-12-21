"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useTranslations } from "next-intl";
import { useMerchantNav } from "../../_components/merchantNav";
import { useProducts } from "./useProducts";
import ProductsTable from "./ProductsTable";
import AddProductModal from "./AddProductModal";
import ImportProductsCsvModal from "./ImportProductsCsvModal";
import { useState } from "react";

export default function ProductsPage() {
  const t = useTranslations("products");
  const nav = useMerchantNav();
  const { data, loading, error, reload } = useProducts();

  const [openAdd, setOpenAdd] = useState(false);
  const [openCsv, setOpenCsv] = useState(false);

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-6">
        <div className="flex items-center justify-between mb-4 gap-3">
          <h1 className="text-lg font-semibold">{t("title")}</h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOpenCsv(true)}
              className="rounded-xl border border-black/20 dark:border-white/20 px-4 py-2 text-sm hover:opacity-90"
            >
              {t("importCsv")}
            </button>

            <button
              onClick={() => setOpenAdd(true)}
              className="rounded-xl bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black hover:opacity-90"
            >
              {t("add")}
            </button>
          </div>
        </div>

        {loading && <div>{t("loading")}</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && (
          <ProductsTable products={data} onChanged={reload} />
        )}
      </div>

      {openAdd && (
        <AddProductModal
          onClose={() => setOpenAdd(false)}
          onCreated={() => {
            reload();
            setOpenAdd(false);
          }}
        />
      )}

      {openCsv && (
        <ImportProductsCsvModal
          onClose={() => setOpenCsv(false)}
          onImported={() => {
            reload();
            setOpenCsv(false);
          }}
        />
      )}
    </DashboardShell>
  );
}
