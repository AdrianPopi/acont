"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import { useTranslations } from "next-intl";
import { useMerchantNav } from "../../_components/merchantNav";
import { useClients } from "./useClients";
import ClientsTable from "./ClientsTable";
import { useState } from "react";
import AddClientModal from "./AddClientModal";

export default function ClientsPage() {
  const t = useTranslations("clients");
  const nav = useMerchantNav();
  const { data, loading, error, reload } = useClients();
  const [open, setOpen] = useState(false);

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold">{t("title")}</h1>

          <button
            onClick={() => setOpen(true)}
            className="rounded-xl bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black"
          >
            {t("add")}
          </button>
        </div>

        {loading && <div>{t("loading")}</div>}
        {error && <div className="text-red-500">{error}</div>}
        {!loading && !error && <ClientsTable clients={data} />}
      </div>

      {open && (
        <AddClientModal onClose={() => setOpen(false)} onCreated={reload} />
      )}
    </DashboardShell>
  );
}
