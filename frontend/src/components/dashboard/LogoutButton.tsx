"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LogOut } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // even if backend fails, still clear locally
    } finally {
      sessionStorage.removeItem("access_token");
      setLoading(false);
      router.replace(`/${locale}/auth/login`);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-2 text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:border-rose-300 dark:hover:border-rose-700 transition-all disabled:opacity-50"
      title={t("logout")}
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">
        {loading ? t("loggingOut") : t("logout")}
      </span>
    </button>
  );
}
