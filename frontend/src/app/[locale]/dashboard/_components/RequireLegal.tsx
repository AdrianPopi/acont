"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";

export default function RequireLegal() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function run() {
      const base = process.env.NEXT_PUBLIC_API_URL;
      if (!base) {
        setChecked(true);
        return;
      }

      try {
        const res = await fetch(
          `${base}/auth/me?locale=${encodeURIComponent(locale)}`,
          { credentials: "include", cache: "no-store" }
        );

        if (!mounted) return;

        if (!res.ok) {
          // nu e logat → trimite la login
          const next = encodeURIComponent(pathname || "/");
          router.replace(`/${locale}/auth/login?next=${next}`);
          return;
        }

        const me = (await res.json()) as {
          needs_legal_update?: boolean;
        };

        if (me.needs_legal_update) {
          const next = encodeURIComponent(pathname || `/${locale}/dashboard`);
          router.replace(`/${locale}/legal/accept?next=${next}`);
          return;
        }
      } catch {
        // fail-open: nu blocăm UI
      } finally {
        if (mounted) setChecked(true);
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, [router, locale, pathname]);

  // 🔑 CRUCIAL: NU returnăm null până nu s-a verificat
  if (!checked) {
    return (
      <div className="p-6 text-sm opacity-60">Checking account status…</div>
    );
  }

  return null;
}
