"use client";

import { FormEvent, useState, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";

function ResetPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("auth.resetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");

    if (password !== confirmPassword) {
      setErr(t("passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setErr("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
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

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] dark:bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]">
        <div className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 p-6 md:p-8 bg-[rgb(var(--card))] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] dark:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-3">{t("errorGeneric")}</h2>
          <p className="text-sm opacity-80 mb-6">
            Invalid or missing reset token.
          </p>
          <Link
            href={`/${locale}/auth/forgot-password`}
            className="inline-block px-6 py-2.5 rounded-2xl bg-brand-gradient text-black font-medium shadow-glow hover:brightness-105 transition"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
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
            className="inline-block px-6 py-2.5 rounded-2xl bg-brand-gradient text-black font-medium shadow-glow hover:brightness-105 transition"
          >
            {t("loginLink")}
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
            <Lock className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
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

        {/* New Password */}
        <label className="block text-sm opacity-80" htmlFor="password">
          {t("passwordLabel")}
        </label>
        <div className="mt-2 relative">
          <input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 pr-11
            placeholder:opacity-60
            outline-none transition
            focus:border-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
            opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10
            transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Confirm Password */}
        <label
          className="block mt-4 text-sm opacity-80"
          htmlFor="confirmPassword"
        >
          {t("confirmLabel")}
        </label>
        <div className="mt-2 relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirmPwd ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 pr-11
            placeholder:opacity-60
            outline-none transition
            focus:border-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPlaceholder")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
            opacity-70 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10
            transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
          >
            {showConfirmPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

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
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
