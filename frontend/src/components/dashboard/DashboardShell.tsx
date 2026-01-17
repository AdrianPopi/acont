"use client";

import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import BrandLogo from "@/components/ui/BrandLogo";
import LogoutButton from "@/components/dashboard/LogoutButton";
import { useTranslations } from "next-intl";
import { useMe } from "@/hooks/useMe";

type NavItem = { href: string; label: string };

export default function DashboardShell({
  titleKey,
  nav,
  children,
}: {
  titleKey: string; // ex: "merchant.title"
  nav: NavItem[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("dashboard");
  const { me } = useMe();

  const current = useMemo(() => pathname || "", [pathname]);

  function isActive(href: string) {
    // href already includes /{locale}/...
    return current === href || current.startsWith(href + "/");
  }

  const Sidebar = (
    <div className="space-y-1 text-sm">
      <div className="flex items-center gap-3 px-2 py-3 mb-4">
        <BrandLogo size={40} />
        <div className="leading-tight">
          <div className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
            ACONT
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-600 to-transparent my-4" />

      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={[
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-gradient-to-r from-brand-1 to-brand-5 text-slate-900 shadow-lg shadow-brand-3/30"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white",
            ].join(" ")}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${active ? "bg-slate-900" : "bg-current opacity-40"}`}
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  const TopRight = (
    <div className="flex items-center gap-2">
      {me?.email && (
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-1/10 to-brand-5/10 dark:from-brand-1/20 dark:to-brand-5/20 border border-brand-3/20 dark:border-brand-3/30 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-brand-1 to-brand-3 animate-pulse" />
          {me.email}
        </div>
      )}
      <ThemeToggle />
      <LanguageSwitcher />
      <LogoutButton />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712]">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm hover:border-brand-3/50 dark:hover:border-brand-3/50 transition-colors"
            aria-label="Open menu"
          >
            <svg
              className="w-5 h-5 text-slate-600 dark:text-slate-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <BrandLogo size={28} />
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              ACONT
            </div>
          </div>

          <div className="flex items-center gap-2">{TopRight}</div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-2xl px-0 lg:px-6 lg:py-6">
        <div className="lg:grid lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block sticky top-6 h-[calc(100vh-3rem)]">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-black/30 p-5 h-full overflow-y-auto">
              {Sidebar}
            </div>
          </aside>

          {/* Content */}
          <main className="py-4 px-4 lg:px-0">
            {/* Topbar desktop */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full bg-gradient-to-b from-brand-1 to-brand-5" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Dashboard
                </span>
              </div>
              {TopRight}
            </div>

            {children}
          </main>
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-white dark:bg-slate-900 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold text-slate-900 dark:text-slate-50">
                {t("menu")}
              </div>
              <button
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setOpen(false)}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 p-4">
              {Sidebar}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
