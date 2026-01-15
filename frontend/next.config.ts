import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// IMPORTANT: here must be request.ts
// Build: 2026-01-15
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
