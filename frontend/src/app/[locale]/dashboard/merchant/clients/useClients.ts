"use client";

import { useEffect, useState } from "react";
import { Client } from "./types";

export function useClients() {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${base}/clients/`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to load clients");
      }

      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { data, loading, error, reload: load };
}
