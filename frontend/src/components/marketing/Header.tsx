"use client";

import Link from "next/link";
import { useState } from "react";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Container from "@/components/ui/Container";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 dark:border-white/10 bg-[rgb(var(--bg))]/80 backdrop-blur">
      <Container>
        <div className="flex items-center justify-between py-3 sm:py-4 gap-3">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-3 shrink-0"
          >
            <BrandLogo size={40} />
            <span className="font-semibold tracking-tight">ACONT</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="opacity-80 hover:opacity-100">
              {t("nav.features")}
            </a>
            <a href="#how" className="opacity-80 hover:opacity-100">
              {t("nav.how")}
            </a>
            <a href="#pricing" className="opacity-80 hover:opacity-100">
              {t("nav.pricing")}
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Desktop auth buttons */}
            <Link
              href={`/${locale}/auth/login`}
              className="hidden sm:inline-flex rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:shadow-glow transition"
            >
              {t("nav.login")}
            </Link>
            <Link
              href={`/${locale}/auth/signup`}
              className="hidden sm:inline-flex rounded-xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium shadow-glow hover:opacity-95 transition"
            >
              {t("nav.signup")}
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm"
              aria-label="Menu"
              aria-expanded={open}
            >
              {open ? "✕" : "☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden pb-4">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-3">
              <nav className="flex flex-col gap-2 text-sm">
                <a
                  href="#features"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t("nav.features")}
                </a>
                <a
                  href="#how"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t("nav.how")}
                </a>
                <a
                  href="#pricing"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {t("nav.pricing")}
                </a>

                <div className="h-px bg-black/10 dark:bg-white/10 my-2" />

                <Link
                  href={`/${locale}/auth/login`}
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm text-center hover:shadow-glow transition"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href={`/${locale}/auth/signup`}
                  onClick={() => setOpen(false)}
                  className="rounded-xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium text-center shadow-glow hover:opacity-95 transition"
                >
                  {t("nav.signup")}
                </Link>
              </nav>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
}
