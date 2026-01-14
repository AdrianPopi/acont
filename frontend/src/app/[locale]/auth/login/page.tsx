"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

type LoginRes = { access_token: string; role: string; token_type?: string };

function parseErrorText(text: string) {
  try {
    const j = JSON.parse(text);
    return j.detail || j.message || text;
  } catch {
    return text;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth.login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ NEW: check existing session (cookies) and redirect
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      try {
        const res = await fetch(`${base}/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!mounted) return;

        if (res.ok) {
          const me = (await res.json()) as { role?: string };

          if (me.role === "merchant_admin") {
            router.replace(`/${locale}/dashboard/merchant`);
            return;
          }
          if (me.role === "platform_admin") {
            router.replace(`/${locale}/admin`);
            return;
          }
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, locale]);

  if (checking) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";

      const res = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // cookies (access+refresh)
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(parseErrorText(text));

      const auth = JSON.parse(text) as LoginRes;

      // ✅ Save token to sessionStorage for apiFetch
      if (auth.access_token) {
        sessionStorage.setItem("access_token", auth.access_token);
      }

      if (auth.role === "merchant_admin")
        router.push(`/${locale}/dashboard/merchant`);
      else router.push(`/${locale}/admin`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10 bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(0,0,0,0.06),transparent_60%)] dark:bg-[radial-gradient(1200px_circle_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-black/10 dark:border-white/10 p-6 md:p-7 bg-[rgb(var(--card))] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35)] dark:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm"
      >
        {err && (
          <div className="mt-1 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-500">{err}</p>
          </div>
        )}

        <label className="block mt-4 text-sm opacity-80" htmlFor="email">
          {t("emailLabel")}
        </label>
        <input
          id="email"
          name="email"
          autoComplete="email"
          className="mt-2 w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5
          placeholder:opacity-60
          outline-none transition
          focus:border-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
        />

        <label className="block mt-4 text-sm opacity-80" htmlFor="password">
          {t("passwordLabel")}
        </label>
        <div className="mt-2 relative">
          <input
            id="password"
            name="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 pr-11
            placeholder:opacity-60
            outline-none transition
            focus:border-transparent focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20"
            type={showPwd ? "text" : "password"}
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
            aria-label={showPwd ? t("hidePassword") : t("showPassword")}
          >
            {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          disabled={loading}
          className="mt-6 w-full rounded-2xl bg-brand-gradient px-4 py-2.5 text-black font-medium shadow-glow
          transition active:brightness-95 hover:brightness-105
          disabled:opacity-60 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
        >
          {loading ? t("signingIn") : t("signIn")}
        </button>
      </form>
    </div>
  );
}
