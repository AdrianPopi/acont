import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// IMPORTANT: here must be  request.ts
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
