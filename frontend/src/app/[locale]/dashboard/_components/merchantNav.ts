import { useTranslations, useLocale } from "next-intl";

export function useMerchantNav() {
  const t = useTranslations("dashboard.merchant");
  const locale = useLocale();

  return [
    {
      href: `/${locale}/dashboard/merchant`,
      label: t("overview"),
    },
    {
      href: `/${locale}/dashboard/merchant/invoices`,
      label: t("invoices"),
    },
    {
      href: `/${locale}/dashboard/merchant/credit-notes`,
      label: t("creditNotes"),
    },
    {
      href: `/${locale}/dashboard/merchant/clients`,
      label: t("clients"),
    },
    {
      href: `/${locale}/dashboard/merchant/products`,
      label: t("products"),
    },
    {
      href: `/${locale}/dashboard/merchant/deviz`,
      label: t("deviz"),
    },
    {
      href: `/${locale}/dashboard/merchant/reports`,
      label: t("reports"),
    },
    {
      href: `/${locale}/dashboard/merchant/settings`,
      label: t("settings"),
    },
  ];
}
