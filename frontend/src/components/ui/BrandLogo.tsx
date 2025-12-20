"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useMounted } from "@/components/ui/useMounted";

export default function BrandLogo({ size = 44 }: { size?: number }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();

  if (!mounted) {
    return (
      <div
        className="rounded-xl bg-black/10 dark:bg-white/10"
        style={{ width: size, height: size }}
      />
    );
  }

  const src = resolvedTheme === "dark" ? "/logo_white.jpg" : "/logo_black.jpg";

  return (
    <Image
      src={src}
      alt="ACONT"
      width={size}
      height={size}
      className="rounded-xl"
      priority={false}
    />
  );
}
