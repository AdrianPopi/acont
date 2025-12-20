import { getTranslations } from "next-intl/server";
import Link from "next/link";
import PrintButton from "../_components/PrintButton";
import ReactMarkdown from "react-markdown";

type Props = { params: Promise<{ locale: string }> };

type PublicDoc = {
  version: string;
  published_at?: string | null;
  content_md: string;
};

async function getDoc(locale: string, docType: "terms" | "privacy") {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;

  const res = await fetch(
    `${base}/legal/public/${docType}?locale=${encodeURIComponent(locale)}`,
    {
      cache: "no-store",
    }
  );

  if (!res.ok) return null;
  return (await res.json()) as PublicDoc;
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "legal.privacy" });
  const doc = await getDoc(locale, "privacy");

  const lastUpdated = doc?.published_at?.slice(0, 10) || t("lastUpdatedValue");
  const md = doc?.content_md || "";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">{t("title")}</h1>
            <p className="mt-1 text-sm opacity-80">
              {t("lastUpdatedLabel")}:{" "}
              <span className="font-medium">{lastUpdated}</span>
              {doc?.version ? (
                <span className="ml-2 opacity-70">v{doc.version}</span>
              ) : null}
            </p>
          </div>

          <div className="flex gap-2">
            <PrintButton />
            <Link
              href={`/${locale}/auth/signup`}
              className="rounded-xl bg-brand-gradient px-4 py-2 text-sm text-black font-medium shadow-glow hover:opacity-90"
            >
              {t("backToSignup")}
            </Link>
          </div>
        </div>

        <div className="mt-8 space-y-6 leading-7 prose dark:prose-invert max-w-none">
          {md ? (
            <ReactMarkdown>{md}</ReactMarkdown>
          ) : (
            <>
              <section>
                <h2 className="text-lg font-semibold">{t("s1Title")}</h2>
                <p className="mt-2 opacity-90">{t("s1Body")}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">{t("s2Title")}</h2>
                <p className="mt-2 opacity-90">{t("s2Body")}</p>
              </section>

              <section>
                <h2 className="text-lg font-semibold">{t("s3Title")}</h2>
                <p className="mt-2 opacity-90">{t("s3Body")}</p>
              </section>
            </>
          )}

          <hr className="border-black/10 dark:border-white/10" />
          <p className="text-sm opacity-80">{t("footerNote")}</p>
        </div>
      </div>
    </div>
  );
}
