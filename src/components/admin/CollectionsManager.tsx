"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createCollection,
  deleteCollection,
  renameCollection,
} from "@/app/admin/actions";
import type { CollectionWithCount } from "@/lib/types";

export function CollectionsManager({
  collections,
}: {
  collections: CollectionWithCount[];
}) {
  const [rows, setRows] = useState(collections);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const signature = collections.map((c) => `${c.id}:${c.name}:${c.painting_count}`).join("|");
  useEffect(() => {
    setRows(collections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    setError(null);
    setName("");
    startTransition(async () => {
      const res = await createCollection(clean);
      if (!res.ok) setError(res.error);
    });
  }

  function rename(id: string, current: string) {
    const next = window.prompt("Rename collection", current);
    if (next == null || next.trim() === current) return;
    setError(null);
    setRows((r) => r.map((c) => (c.id === id ? { ...c, name: next.trim() } : c)));
    startTransition(async () => {
      const res = await renameCollection(id, next.trim());
      if (!res.ok) setError(res.error);
    });
  }

  function remove(id: string, current: string, count: number) {
    if (count > 0) {
      setError(
        `“${current}” still has ${count} painting${count === 1 ? "" : "s"}. Move or delete them first.`,
      );
      return;
    }
    if (!window.confirm(`Delete collection “${current}”?`)) return;
    setError(null);
    const snapshot = rows;
    setRows((r) => r.filter((c) => c.id !== id));
    startTransition(async () => {
      const res = await deleteCollection(id);
      if (!res.ok) {
        setError(res.error);
        setRows(snapshot);
      }
    });
  }

  return (
    <div className="border border-line bg-white p-4">
      {error && (
        <p className="mb-3 border border-[#EBD9CF] bg-[#FBF6F3] px-3 py-2 text-[12px] text-accent-deep">
          {error}
        </p>
      )}

      <div className="flex flex-col">
        {rows.length === 0 && (
          <p className="py-3 text-[13px] text-muted">No collections yet.</p>
        )}
        {rows.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-2.5 border-b border-line/60 py-2.5"
          >
            <div>
              <div className="text-[13px]">{c.name}</div>
              <div className="text-[11px] text-muted">
                {c.painting_count} work{c.painting_count === 1 ? "" : "s"}
              </div>
            </div>
            <div className="whitespace-nowrap">
              <button
                onClick={() => rename(c.id, c.name)}
                className="text-[12px] text-blue"
              >
                Rename
              </button>
              <span className="mx-2 text-line-warm">/</span>
              <button
                onClick={() => remove(c.id, c.name, c.painting_count)}
                className="text-[12px] text-accent-deep"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={add} className="mt-3.5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New collection name"
          className="min-w-0 flex-1 border border-line px-2.5 py-2 text-[13px] outline-none focus:border-blue"
        />
        <button
          type="submit"
          disabled={pending}
          className="border border-line bg-[#FBFAF7] px-3.5 py-2 text-[11px] uppercase tracking-[0.1em] text-ink-soft disabled:opacity-60"
        >
          Add
        </button>
      </form>
    </div>
  );
}
