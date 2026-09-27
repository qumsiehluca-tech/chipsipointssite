"use client";

import { useState, type FormEvent } from "react";
import { addBrother } from "@/lib/data";

export default function AddBrotherForm({ password, onAdded }: { password: string; onAdded: () => void }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setStatus(null);
    const result = await addBrother(password, name.trim());
    setSubmitting(false);
    if (result.ok) {
      setStatus(`Added ${name.trim()} to the roster.`);
      setName("");
      onAdded();
    } else {
      setStatus(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-14 pb-10 border-b border-gold/10">
      <p className="eyebrow text-parchmentDim mb-3">Add a brother</p>
      <div className="flex items-end gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="flex-1 bg-transparent border-b border-gold/25 rounded-none px-1 py-3 text-parchment placeholder:text-parchmentDim/50 focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="border border-gold/60 text-gold hover:bg-gold hover:text-ink transition-colors font-body text-xs tracking-[0.2em] uppercase px-6 py-3 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold shrink-0"
        >
          {submitting ? "Adding…" : "Add"}
        </button>
      </div>
      {status && <p className="text-sm text-gold mt-3">{status}</p>}
    </form>
  );
}
