"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api"; // use apiFetch with refresh+Bearer
import { useLocale } from "next-intl";

export type MeRes = {
  id: number;
  email: string;
  role: "merchant_admin" | "platform_admin";
  is_active: boolean;
  is_email_verified: boolean;
  needs_legal_update?: boolean;
};

export function useMe() {
  const locale = useLocale();
  const [me, setMe] = useState<MeRes | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await apiFetch<MeRes>(
          `/auth/me?locale=${encodeURIComponent(locale)}`
        );
        if (alive) setMe(data);
      } catch {
        if (alive) setMe(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [locale]); // ✅ depinde de locale

  return { me, loading };
}
