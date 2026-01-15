import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

async function getMe() {
  const base = process.env.NEXT_PUBLIC_API_URL || "/api";

  // ✅ Next 15/16: cookies() is async
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const res = await fetch(`${base}/auth/me`, {
    method: "GET",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return (await res.json()) as {
    id: number;
    email: string;
    role: "merchant_admin" | "platform_admin";
    is_active: boolean;
    is_email_verified: boolean;
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getMe();

  if (!me) redirect("/auth/login");
  if (me.role !== "platform_admin") redirect("/auth/login");

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="sticky top-0 z-40 border-b border-black/10 dark:border-white/10 bg-[rgb(var(--bg))]/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between py-3 gap-3">
            <div className="flex items-center gap-3">
              <BrandLogo size={34} />
              <div className="leading-tight">
                <div className="font-semibold tracking-tight">ACONT</div>
                <div className="text-xs opacity-70">Admin Console</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
