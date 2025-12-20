import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./routing";

function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const candidate = await requestLocale;
  const locale: Locale =
    candidate && isLocale(candidate) ? candidate : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
