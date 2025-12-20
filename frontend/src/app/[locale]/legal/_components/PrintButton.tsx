"use client";

import { useTranslations } from "next-intl";

export default function PrintButton() {
  const t = useTranslations("legal.common");
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:opacity-90"
    >
      {t("print")}
    </button>
  );
}
