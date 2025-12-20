"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddProductDialog() {
  const t = useTranslations("products");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
      >
        {t("add")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-black space-y-4">
            <h2 className="text-lg font-semibold">{t("add")}</h2>

            {/* form inputs aici */}

            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setOpen(false)}>Cancel</button>
              <button className="bg-primary text-white px-4 py-2 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
