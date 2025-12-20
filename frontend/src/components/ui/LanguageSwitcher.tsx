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
      className="rounded-xl border border-black/10 dark:border-white/10 bg-[rgb(var(--bg))] text-[rgb(var(--fg))] px-3 py-2 text-sm outline-none"
      aria-label="Language"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
