"use client";

import { useState } from "react";
import { Client } from "./types";

type EditableClientField = "name" | "email" | "tax_id" | "address";

type ClientForm = {
  name: string;
  email: string;
  tax_id: string;
  address: string;
};

export default function EditClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: Client;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ClientForm>({
    name: client.name,
    email: client.email ?? "",
    tax_id: client.tax_id ?? "",
    address: client.address ?? "",
  });

  async function submit() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${client.id}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    onSaved();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-black rounded-2xl p-6 w-[400px]">
        <h2 className="text-lg font-semibold mb-4">Edit client</h2>

        {(["name", "email", "tax_id", "address"] as EditableClientField[]).map(
          (field) => (
            <input
              key={field}
              placeholder={field}
              className="w-full mb-2 px-3 py-2 rounded border"
              value={form[field]}
              onChange={(e) =>
                setForm({
                  ...form,
                  [field]: e.target.value,
                })
              }
            />
          )
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={submit}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
