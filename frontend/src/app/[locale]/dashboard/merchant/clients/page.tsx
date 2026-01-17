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
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-50 dark:via-slate-100 dark:to-slate-50 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage and organize your business clients
          </p>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-700/50 p-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {t("list")}
            </h2>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors shadow-lg"
            >
              <svg
                className="w-4 h-4"
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
              {t("add")}
            </button>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            {!loading && !error && <ClientsTable clients={data} />}
          </div>
        </div>
      </div>

      {open && (
        <AddClientModal onClose={() => setOpen(false)} onCreated={reload} />
      )}
    </DashboardShell>
  );
}
