"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { refreshAccessToken } from "../../../../lib/api";

type Versions = { terms_version: string; privacy_version: string };

function parseErrorText(text: string) {
  try {
    const j = JSON.parse(text) as { detail?: string; message?: string };
    return j.detail || j.message || text;
  } catch {
    return text;
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("access_token")
  );
}

export default function LegalAcceptPage() {
  const t = useTranslations("legal.accept");
  const locale = useLocale();
  const router = useRouter();
  const sp = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const [versions, setVersions] = useState<Versions | null>(null);

  const next = sp.get("next") || `/${locale}/dashboard`;

  useEffect(() => {
    let mounted = true;

    async function load() {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) return;

      const token = getToken();

      const res = await fetch(`${base}/auth/legal-versions`, {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      if (!mounted) return;
      if (!res.ok) return;

      const data = (await res.json()) as Versions;
      setVersions(data);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [locale]);

  const canSubmit = useMemo(() => {
    return acceptTerms && acceptPrivacy && !loading;
  }, [acceptTerms, acceptPrivacy, loading]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) throw new Error("NEXT_PUBLIC_API_URL is missing");

      // helper: încearcă o dată; dacă e 401, încearcă refresh și repetă
      async function doAccept(): Promise<Response> {
        const token = getToken();
        return fetch(`${base}/auth/legal-accept`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            accept_terms: acceptTerms,
            accept_privacy: acceptPrivacy,
          }),
        });
      }

      let res = await doAccept();

      // dacă cookie/token a expirat și backend folosește refresh cookie
      if (res.status === 401) {
        try {
          await refreshAccessToken();
        } catch {
          // refresh failed; proceed to throw below
        }
        res = await doAccept();
      }

      const text = await res.text();
      if (!res.ok) throw new Error(parseErrorText(text));

      router.replace(next);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm opacity-80">{t("subtitle")}</p>

        {versions && (
          <div className="mt-4 rounded-2xl border border-black/10 dark:border-white/10 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="opacity-80">{t("termsVersion")}</span>
              <span className="font-medium">{versions.terms_version}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="opacity-80">{t("privacyVersion")}</span>
              <span className="font-medium">{versions.privacy_version}</span>
            </div>
          </div>
        )}

        {err && <p className="mt-4 text-sm text-red-500">{err}</p>}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-black/20 dark:border-white/20 bg-transparent"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <span className="leading-5">
              {t("agreeTermsPrefix")}{" "}
              <Link
                href={`/${locale}/legal/terms`}
                className="underline underline-offset-4 hover:opacity-90"
                target="_blank"
                rel="noreferrer"
              >
                {t("termsLink")}
              </Link>
              .
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-black/20 dark:border-white/20 bg-transparent"
              checked={acceptPrivacy}
              onChange={(e) => setAcceptPrivacy(e.target.checked)}
            />
            <span className="leading-5">
              {t("agreePrivacyPrefix")}{" "}
              <Link
                href={`/${locale}/legal/privacy`}
                className="underline underline-offset-4 hover:opacity-90"
                target="_blank"
                rel="noreferrer"
              >
                {t("privacyLink")}
              </Link>
              .
            </span>
          </label>

          <button
            disabled={!canSubmit}
            className="mt-2 w-full rounded-2xl bg-brand-gradient px-4 py-2 text-black font-medium shadow-glow disabled:opacity-60"
          >
            {loading ? t("saving") : t("acceptAndContinue")}
          </button>

          <p className="text-xs opacity-70">{t("footerNote")}</p>
        </form>
      </div>
    </div>
  );
}
