"use client";

import { useState, type FormEvent } from "react";
import { postLogEntries } from "@/lib/data";
import type { Brother, PointValue } from "@/lib/types";

export default function AdminLogForm({
  password,
  brothers,
  pointValues,
  onLogged
}: {
  password: string;
  brothers: string[];
  pointValues: PointValue[];
  onLogged: (brothers: Brother[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [action, setAction] = useState(pointValues[0]?.action ?? "");
  const [points, setPoints] = useState(pointValues[0]?.points ?? 0);
  const [notes, setNotes] = useState("");
  const [loggedBy, setLoggedBy] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleBrother(name: string) {
    setSelected((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function handleActionChange(value: string) {
    setAction(value);
    const match = pointValues.find((pv) => pv.action === value);
    if (match) setPoints(match.points);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (selected.length === 0 || !action) return;
    setSubmitting(true);
    setStatus(null);

    const entries = selected.map((name) => ({ name, action, points, notes, loggedBy }));
    const updated = await postLogEntries(password, entries);

    setSubmitting(false);
    if (updated) {
      setStatus(`Logged for ${selected.length} brother${selected.length > 1 ? "s" : ""}.`);
      onLogged(updated);
      setSelected([]);
      setNotes("");
    } else {
      setStatus("Something went wrong — couldn't reach the points backend.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <p className="text-sm text-parchmentDim mb-3">Brothers ({selected.length} selected)</p>
        <div className="rule mb-2" />
        <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
          {brothers.map((name) => (
            <label
              key={name}
              className="flex items-center gap-3 py-1.5 cursor-pointer text-sm text-parchment hover:text-goldBright"
            >
              <input
                type="checkbox"
                checked={selected.includes(name)}
                onChange={() => toggleBrother(name)}
                className="accent-gold"
              />
              {name}
            </label>
          ))}
          {brothers.length === 0 && <p className="text-parchmentDim text-sm">No brothers yet.</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm text-parchmentDim mb-2">Action</label>
        <select
          value={action}
          onChange={(e) => handleActionChange(e.target.value)}
          className="w-full bg-lodge border border-gold/30 rounded px-4 py-3 text-parchment focus:outline-none focus:border-gold"
        >
          {pointValues.map((pv) => (
            <option key={pv.action} value={pv.action}>
              {pv.action} ({pv.points >= 0 ? "+" : ""}
              {pv.points})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-parchmentDim mb-2">Points</label>
        <input
          type="number"
          step="0.5"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-full bg-lodge border border-gold/30 rounded px-4 py-3 text-parchment focus:outline-none focus:border-gold"
        />
        <p className="text-xs text-parchmentDim mt-1">
          Override for variable actions (summer help, discretionary &quot;Other&quot;).
        </p>
      </div>

      <div>
        <label className="block text-sm text-parchmentDim mb-2">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-lodge border border-gold/30 rounded px-4 py-3 text-parchment focus:outline-none focus:border-gold"
        />
      </div>

      <div>
        <label className="block text-sm text-parchmentDim mb-2">Logged by</label>
        <input
          type="text"
          value={loggedBy}
          onChange={(e) => setLoggedBy(e.target.value)}
          placeholder="Your name"
          className="w-full bg-lodge border border-gold/30 rounded px-4 py-3 text-parchment focus:outline-none focus:border-gold"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || selected.length === 0 || !action}
        className="bg-purple hover:bg-purpleLight transition-colors text-parchment font-display px-8 py-3 rounded disabled:opacity-50"
      >
        {submitting ? "Logging…" : `Log for ${selected.length || 0} brother${selected.length === 1 ? "" : "s"}`}
      </button>

      {status && <p className="text-sm text-gold">{status}</p>}
    </form>
  );
}
