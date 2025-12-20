"use client";

import { Client } from "./types";
import { useState } from "react";
import EditClientModal from "./EditClientModal";

export default function ClientsTable({ clients }: { clients: Client[] }) {
  const [edit, setEdit] = useState<Client | null>(null);

  async function remove(id: number) {
    if (!confirm("Delete client?")) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/clients/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    window.location.reload();
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-black/10 dark:border-white/10">
            <tr className="text-left opacity-70">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Tax ID</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                className="border-b border-black/5 dark:border-white/5"
              >
                <td className="py-2 font-medium">{c.name}</td>
                <td>{c.email || "-"}</td>
                <td>{c.tax_id || "-"}</td>
                <td>{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="flex gap-2 py-2">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => setEdit(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => remove(c.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {edit && (
        <EditClientModal
          client={edit}
          onClose={() => setEdit(null)}
          onSaved={() => window.location.reload()}
        />
      )}
    </>
  );
}
