"use client";

import { useEffect, useState } from "react";

type DocType = "terms" | "privacy";

type Item = {
  id: number;
  doc_type: DocType;
  version: string;
  locale: string;
  is_published: boolean;
  published_at?: string | null;
};

type ListResponse = { items: Item[] };

type DocResponse = {
  id: number;
  doc_type: DocType;
  version: string;
  locale: string;
  is_published: boolean;
  published_at?: string | null;
  content_md: string;
  content_url?: string | null;
};

function toErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return "Unknown error";
  }
}

export default function LegalDocsAdmin() {
  const base = process.env.NEXT_PUBLIC_API_URL;

  const [docType, setDocType] = useState<DocType>("terms");
  const [locale, setLocale] = useState<"en" | "ro" | "fr" | "nl">("en");
  const [version, setVersion] = useState("1.0.0");
  const [contentMd, setContentMd] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadList(nextDocType = docType, nextLocale = locale) {
    if (!base) return;
    const res = await fetch(
      `${base}/admin/legal-documents?doc_type=${encodeURIComponent(
        nextDocType
      )}&locale=${encodeURIComponent(nextLocale)}`,
      { credentials: "include", cache: "no-store" }
    );

    const text = await res.text();
    if (!res.ok) throw new Error(text);

    const data: ListResponse = JSON.parse(text) as ListResponse;
    setItems(Array.isArray(data.items) ? data.items : []);
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setErr("");
        await loadList();
      } catch (e: unknown) {
        if (!cancelled) setErr(toErrorMessage(e));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType, locale]);

  async function openDoc(id: number) {
    if (!base) return;
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${base}/admin/legal-documents/${id}`, {
        credentials: "include",
        cache: "no-store",
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      const d: DocResponse = JSON.parse(text) as DocResponse;

      setDocType(d.doc_type);
      setLocale(d.locale as typeof locale);
      setVersion(d.version);
      setContentMd(d.content_md || "");
    } catch (e: unknown) {
      setErr(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    if (!base) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${base}/admin/legal-documents/publish`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: docType,
          locale,
          version: version.trim(),
          content_md: contentMd,
          content_url: "",
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      await loadList(docType, locale);
    } catch (e: unknown) {
      setErr(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[rgb(var(--card))] p-5 space-y-4">
      <div className="text-sm font-semibold">Legal documents</div>

      {err && <p className="text-sm text-red-500">{err}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <div className="text-xs opacity-70 mb-1">Doc type</div>
          <select
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocType)}
          >
            <option value="terms">Terms</option>
            <option value="privacy">Privacy</option>
          </select>
        </div>

        <div>
          <div className="text-xs opacity-70 mb-1">Locale</div>
          <select
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={locale}
            onChange={(e) => setLocale(e.target.value as typeof locale)}
          >
            <option value="en">en</option>
            <option value="ro">ro</option>
            <option value="fr">fr</option>
            <option value="nl">nl</option>
          </select>
        </div>

        <div>
          <div className="text-xs opacity-70 mb-1">Version</div>
          <input
            className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="ex: 1.0.1"
          />
        </div>
      </div>

      <div>
        <div className="text-xs opacity-70 mb-1">Content (Markdown)</div>
        <textarea
          className="w-full min-h-[260px] rounded-2xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-3 text-sm"
          value={contentMd}
          onChange={(e) => setContentMd(e.target.value)}
          placeholder="Write Terms/Privacy here..."
        />
      </div>

      <button
        disabled={loading || !version.trim()}
        onClick={publish}
        className="w-full rounded-2xl bg-brand-gradient px-4 py-2 text-black font-medium shadow-glow disabled:opacity-60"
      >
        {loading ? "Publishing..." : "Publish new version"}
      </button>

      <div className="pt-2 border-t border-black/10 dark:border-white/10">
        <div className="text-xs opacity-70 mb-2">History</div>

        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => openDoc(it.id)}
              className="w-full text-left rounded-2xl border border-black/10 dark:border-white/10 px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {it.doc_type} • {it.locale} • v{it.version}
                </span>

                {it.is_published && (
                  <span className="text-xs px-2 py-1 rounded-full border border-black/10 dark:border-white/10">
                    published
                  </span>
                )}
              </div>

              <div className="text-xs opacity-70">{it.published_at || ""}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
