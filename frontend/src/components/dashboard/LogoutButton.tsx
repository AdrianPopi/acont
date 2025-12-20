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
      className="inline-flex items-center gap-2 rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:shadow-glow transition disabled:opacity-60"
    >
      <LogOut size={16} />
      {loading ? t("loggingOut") : t("logout")}
    </button>
  );
}
