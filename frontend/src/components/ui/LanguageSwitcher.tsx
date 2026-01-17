"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const current = useLocale() as Locale;

  const rest = pathname.replace(/^\/(fr|nl|ro|en)(?=\/|$)/, "") || "";

  return (
    <select
      value={current}
      onChange={(e) => {
        router.push(`/${e.target.value}${rest === "/" ? "" : rest}`);
        router.refresh();
      }}
      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2 text-sm font-medium outline-none cursor-pointer hover:border-brand-3/50 dark:hover:border-brand-3/50 focus:ring-2 focus:ring-brand-3/30 transition-all"
      aria-label="Language"
    >
      {locales.map((l) => (
        <option key={l} value={l} className="bg-white dark:bg-slate-800">
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
