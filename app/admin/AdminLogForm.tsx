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

  const fieldClass =
    "w-full bg-transparent border-b border-gold/25 rounded-none px-1 py-3 text-parchment placeholder:text-parchmentDim/50 focus:outline-none focus:border-gold transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div>
        <p className="eyebrow text-parchmentDim mb-3">Brothers ({selected.length} selected)</p>
        <div className="rule-double mb-1" />
        <div className="max-h-64 overflow-y-auto pr-2">
          {brothers.map((name) => (
            <label
              key={name}
              className="flex items-center gap-3 py-2 border-b border-gold/10 cursor-pointer text-sm text-parchment hover:text-goldBright transition-colors"
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
          {brothers.length === 0 && <p className="text-parchmentDim text-sm py-2">No brothers yet.</p>}
        </div>
      </div>

      <div>
        <label className="eyebrow block text-parchmentDim mb-3">Action</label>
        <select
          value={action}
          onChange={(e) => handleActionChange(e.target.value)}
          className={fieldClass}
        >
          {pointValues.map((pv) => (
            <option key={pv.action} value={pv.action} className="bg-lodge">
              {pv.action} ({pv.points >= 0 ? "+" : ""}
              {pv.points})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="eyebrow block text-parchmentDim mb-3">Points</label>
        <input type="number" step="0.5" value={points} onChange={(e) => setPoints(Number(e.target.value))} className={fieldClass} />
        <p className="text-xs text-parchmentDim/70 mt-2">
          Override for variable actions (summer help, discretionary &quot;Other&quot;).
        </p>
      </div>

      <div>
        <label className="eyebrow block text-parchmentDim mb-3">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldClass} />
      </div>

      <div>
        <label className="eyebrow block text-parchmentDim mb-3">Logged by</label>
        <input
          type="text"
          value={loggedBy}
          onChange={(e) => setLoggedBy(e.target.value)}
          placeholder="Your name"
          className={fieldClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || selected.length === 0 || !action}
        className="border border-gold/60 text-gold hover:bg-gold hover:text-ink transition-colors font-body text-xs tracking-[0.2em] uppercase px-8 py-3 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold"
      >
        {submitting ? "Logging…" : `Log for ${selected.length || 0} brother${selected.length === 1 ? "" : "s"}`}
      </button>

      {status && <p className="text-sm text-gold">{status}</p>}
    </form>
  );
}
