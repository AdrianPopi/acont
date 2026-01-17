"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const t = useTranslations("auth.forgotPassword");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, language: locale }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t("errorGeneric"));
      }

      setSuccess(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] dark:bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]">
        <div className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 p-6 md:p-8 bg-[rgb(var(--card))] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] dark:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-3">{t("title")}</h2>
          <p className="text-sm opacity-80 mb-6">{t("success")}</p>
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
          >
            <ArrowLeft size={18} />
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] dark:bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 p-6 md:p-8 bg-[rgb(var(--card))] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] dark:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-center mb-2">{t("title")}</h1>
        <p className="text-sm text-center opacity-70 mb-6">
          {t("description")}
        </p>

        {err && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-500">{err}</p>
          </div>
        )}

        <label className="block text-sm opacity-80" htmlFor="email">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5
          placeholder:opacity-60
          outline-none transition
          focus:border-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
        />

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-brand-gradient px-4 py-2.5 text-black font-medium shadow-glow
          transition active:brightness-95 hover:brightness-105
          disabled:opacity-60 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
        >
          {loading ? t("submitting") : t("submit")}
        </button>

        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/auth/login`}
            className="inline-flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ArrowLeft size={16} />
            {t("backToLogin")}
          </Link>
        </div>
      </form>
    </div>
  );
}
