"use client";

import Container from "@/components/ui/Container";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Versions = { terms_version: string; privacy_version: string };

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const base = process.env.NEXT_PUBLIC_API_URL || "/api";

  const [v, setV] = useState<Versions | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const res = await fetch(`${base}/auth/legal-versions?locale=${locale}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as Versions;
      if (mounted) setV(data);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [base, locale]);

  return (
    <footer className="border-t border-black/10 dark:border-white/10 py-10">
      <Container>
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-sm opacity-80">
          <div>© {new Date().getFullYear()} ACONT</div>

          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link
              href={`/${locale}/legal/privacy`}
              className="hover:opacity-100"
            >
              {t("footer.rgpd")}
              {v?.privacy_version ? (
                <span className="ml-2 text-xs opacity-70">
                  v{v.privacy_version}
                </span>
              ) : null}
            </Link>

            <Link href={`/${locale}/legal/terms`} className="hover:opacity-100">
              {t("footer.terms")}
              {v?.terms_version ? (
                <span className="ml-2 text-xs opacity-70">
                  v{v.terms_version}
                </span>
              ) : null}
            </Link>

            <Link href={`/${locale}/contact`} className="hover:opacity-100">
              {t("footer.contact")}
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
