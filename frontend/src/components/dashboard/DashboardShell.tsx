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
    <div className="space-y-2 text-sm">
      <div className="flex items-center gap-3 mb-3">
        <BrandLogo size={34} />
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">ACONT</div>
          <div className="text-xs opacity-70">{t(titleKey)}</div>
        </div>
      </div>

      <div className="h-px bg-black/10 dark:bg-white/10 my-3" />

      {nav.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={[
              "block rounded-xl px-3 py-2 transition",
              active
                ? "bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10"
                : "hover:bg-black/5 dark:hover:bg-white/5",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  const TopRight = (
    <div className="flex items-center gap-2">
      {me?.email && (
        <div className="hidden sm:flex items-center rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-xs opacity-90">
          {t("signedInAs")}:{" "}
          <span className="ml-1 font-medium">{me.email}</span>
        </div>
      )}
      <ThemeToggle />
      <LanguageSwitcher />
      <LogoutButton />
    </div>
  );

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-[rgb(var(--bg))]/80 backdrop-blur">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="flex items-center gap-2">
            <div className="text-sm font-semibold">ACONT</div>
          </div>

          <div className="flex items-center gap-2">{TopRight}</div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-2xl px-0 lg:px-6">
        <div className="lg:grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar desktop */}
          <aside className="hidden lg:block sticky top-0 h-screen py-6">
            <div className="h-full rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-4">
              {Sidebar}
            </div>
          </aside>

          {/* Content */}
          <main className="py-6 px-4 lg:px-0">
            {/* Topbar desktop */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="text-sm opacity-70">
                {t("youAreIn")}{" "}
                <span className="font-medium opacity-100">{t(titleKey)}</span>
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
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-[85%] max-w-sm bg-[rgb(var(--bg))] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-semibold">{t("menu")}</div>
              <button
                className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-4">
              {Sidebar}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
