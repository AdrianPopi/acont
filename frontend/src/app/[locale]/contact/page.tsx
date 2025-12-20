import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold">Contact</h1>
            <p className="mt-2 text-sm opacity-80">
              This page is under construction.
            </p>
          </div>

          <Link
            href={`/${locale}`}
            className="rounded-xl border border-black/10 dark:border-white/10 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Back home
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-black/10 dark:border-white/10 p-5">
          <div className="text-sm font-semibold">To be developed</div>
          <p className="mt-2 text-sm opacity-90">
            We’re working on the contact page. Please check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}
