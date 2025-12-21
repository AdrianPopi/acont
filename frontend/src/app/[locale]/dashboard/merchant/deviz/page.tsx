"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import UnderDevelopment from "@/components/dashboard/UnderDevelopment";
import { useMerchantNav } from "../../_components/merchantNav";

export default function QuotesPage() {
  const nav = useMerchantNav();

  return (
    <DashboardShell titleKey="merchant.title" nav={nav}>
      <UnderDevelopment title="" />
    </DashboardShell>
  );
}
