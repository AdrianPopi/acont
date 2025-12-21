"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { useMerchantNav } from "../../_components/merchantNav";

function errMsg(e: unknown) {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : "Failed";
}

export default function MerchantSettingsPage() {
  //const t = useTranslations("dashboard"); // îl poți păstra dacă îl folosești în pagină
  const ts = useTranslations("dashboard.merchantSettings");

  const nav = useMerchantNav();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) throw new Error("NEXT_PUBLIC_API_URL is missing");
      const res = await fetch(`${base}/merchants/me`, {
        credentials: "include",
        cache: "no-store",
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const j = JSON.parse(text);
      setLogoUrl(j.logo_url || null);
    } catch (e: unknown) {
      setErr(errMsg(e));
    }
  }

  async function onUpload(file: File) {
    setErr("");
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) throw new Error("NEXT_PUBLIC_API_URL is missing");

      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${base}/merchants/me/logo`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const j = JSON.parse(text);
      setLogoUrl(j.logo_url || null);
    } catch (e: unknown) {
      setErr(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const base = process.env.NEXT_PUBLIC_API_URL || "";
  const absoluteLogo = logoUrl
    ? logoUrl.startsWith("http")
      ? logoUrl
      : `${base}${logoUrl}`
    : null;

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <h1 className="text-xl font-semibold">{ts("title")}</h1>
      <p className="mt-1 text-sm opacity-70">{ts("subtitle")}</p>

      {err && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {err}
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5">
        <div className="font-semibold">{ts("logoTitle")}</div>
        <div className="text-sm opacity-70 mt-1">{ts("logoHelp")}</div>

        <div className="mt-4 flex items-center gap-4">
          <div className="h-14 w-40 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 flex items-center justify-center overflow-hidden">
            {absoluteLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={absoluteLogo}
                alt="logo"
                className="h-full object-contain p-2"
              />
            ) : (
              <span className="text-xs opacity-60">{ts("noLogo")}</span>
            )}
          </div>

          <label className="inline-flex items-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.currentTarget.value = "";
              }}
            />
            {loading ? ts("uploading") : ts("upload")}
          </label>
        </div>
      </div>
    </DashboardShell>
  );
}
