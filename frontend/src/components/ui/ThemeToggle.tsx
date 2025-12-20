"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/components/ui/useMounted";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <button
        className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm"
        aria-label="Theme"
      >
        Theme
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:shadow-glow transition"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}
