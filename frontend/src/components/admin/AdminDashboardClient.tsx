"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  FileText,
  LogOut,
} from "lucide-react";
import LegalDocsAdmin from "@/components/admin/LegalDocsAdmin";

type Me = {
  id: number;
  email: string;
  role: "merchant_admin" | "platform_admin";
  is_active: boolean;
  is_email_verified: boolean;
};

type TabKey =
  | "overview"
  | "merchants"
  | "users"
  | "audit"
  | "compliance"
  | "legal";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default function AdminDashboardClient() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();

  const base = process.env.NEXT_PUBLIC_API_URL || "/api";

  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");
  const [err, setErr] = useState("");

  const nav = useMemo(
    () => [
      {
        key: "legal" as const,
        icon: FileText,
        label: "Legal docs",
      },

      {
        key: "overview" as const,
        icon: LayoutDashboard,
        label: t("tabs.overview"),
      },
      {
        key: "merchants" as const,
        icon: Building2,
        label: t("tabs.merchants"),
      },
      { key: "users" as const, icon: Users, label: t("tabs.users") },
      { key: "audit" as const, icon: FileText, label: t("tabs.audit") },
      {
        key: "compliance" as const,
        icon: ShieldCheck,
        label: t("tabs.compliance"),
      },
    ],
    [t]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setErr("");
      setLoading(true);
      try {
        const res = await fetch(`${base}/auth/me`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Me;

        if (!cancelled) setMe(data);
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : t("errors.generic"));
          // fallback: trimite la login
          router.push(`/${locale}/auth/login`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [base, router, locale, t]);

  async function logout() {
    try {
      await fetch(`${base}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      router.push(`/${locale}/auth/login`);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-6">
        <div className="text-sm opacity-70">{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5">
      {/* Sidebar */}
      <aside className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-3">
        <div className="px-3 py-3">
          <div className="text-sm font-semibold">{t("title")}</div>
          <div className="mt-1 text-xs opacity-70">{t("subtitle")}</div>
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = tab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={[
                  "w-full flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition",
                  active
                    ? "bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10"
                    : "hover:bg-black/5 dark:hover:bg-white/5",
                ].join(" ")}
              >
                <Icon size={18} className="opacity-80" />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 px-3">
          <div className="h-px bg-black/10 dark:bg-white/10 my-3" />

          <div className="text-xs opacity-70">{t("signedInAs")}</div>
          <div className="text-sm font-medium break-all">{me?.email}</div>
          <div className="mt-1 text-xs opacity-70">
            {t("role")}: <span className="font-medium">{me?.role}</span>
          </div>

          <button
            onClick={logout}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:shadow-glow transition"
          >
            <LogOut size={16} />
            {t("logout")}
          </button>

          {err && <p className="mt-3 text-xs text-red-500">{err}</p>}
        </div>
      </aside>

      {/* Content */}
      <section className="space-y-5">
        {tab === "overview" && (
          <>
            <Card title={t("overview.whatCanYouDoTitle")}>
              <ul className="list-disc pl-5 text-sm opacity-90 space-y-1">
                <li>{t("overview.item1")}</li>
                <li>{t("overview.item2")}</li>
                <li>{t("overview.item3")}</li>
                <li>{t("overview.item4")}</li>
              </ul>
              <p className="mt-3 text-xs opacity-70">{t("overview.note")}</p>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card title={t("overview.quickStats")}>
                <div className="text-sm opacity-80">
                  {t("overview.statsPlaceholder")}
                </div>
              </Card>
              <Card title={t("overview.systemStatus")}>
                <div className="text-sm opacity-80">
                  {t("overview.statusPlaceholder")}
                </div>
              </Card>
            </div>
          </>
        )}

        {tab === "legal" && <LegalDocsAdmin />}

        {tab === "merchants" && (
          <Card title={t("merchants.title")}>
            <div className="text-sm opacity-80">
              {t("merchants.placeholder")}
            </div>
          </Card>
        )}

        {tab === "users" && (
          <Card title={t("users.title")}>
            <div className="text-sm opacity-80">{t("users.placeholder")}</div>
          </Card>
        )}

        {tab === "audit" && (
          <Card title={t("audit.title")}>
            <div className="text-sm opacity-80">{t("audit.placeholder")}</div>
          </Card>
        )}

        {tab === "compliance" && (
          <Card title={t("compliance.title")}>
            <div className="text-sm opacity-80">
              {t("compliance.placeholder")}
            </div>
          </Card>
        )}
      </section>
    </div>
  );
}
