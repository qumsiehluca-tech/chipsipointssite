"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useBrothersData } from "@/lib/useBrothersData";
import { deleteLogEntry, updateLogEntry } from "@/lib/data";
import type { LogEntry, PointValue } from "@/lib/types";
import ErrorState from "../ErrorState";

const fieldClass =
  "w-full bg-transparent border-b border-gold/25 rounded-none px-1 py-2 text-sm text-parchment placeholder:text-parchmentDim/50 focus:outline-none focus:border-gold transition-colors";

function HistoryRow({
  entry,
  brotherName,
  isAdmin,
  password,
  pointValues,
  onChanged
}: {
  entry: LogEntry;
  brotherName: string;
  isAdmin: boolean;
  password: string | null;
  pointValues: PointValue[];
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState(entry.action);
  const [points, setPoints] = useState(entry.points);
  const [notes, setNotes] = useState(entry.notes || "");
  const [date, setDate] = useState(entry.date);
  const [busy, setBusy] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);

  function handleActionChange(value: string) {
    setAction(value);
    const match = pointValues.find((pv) => pv.action === value);
    if (match) setPoints(match.points);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!password || entry.row == null) return;
    setBusy(true);
    setRowError(null);
    const result = await updateLogEntry(password, entry.row, {
      name: brotherName,
      action,
      points,
      notes,
      date,
      loggedBy: entry.loggedBy
    });
    setBusy(false);
    if (result.ok) {
      setEditing(false);
      onChanged();
    } else {
      setRowError(result.error);
    }
  }

  async function handleDelete() {
    if (!password || entry.row == null) return;
    if (!window.confirm(`Delete "${action}" (${points >= 0 ? "+" : ""}${points} pts)? This can't be undone.`)) return;
    setBusy(true);
    setRowError(null);
    const result = await deleteLogEntry(password, entry.row);
    setBusy(false);
    if (result.ok) {
      onChanged();
    } else {
      setRowError(result.error);
    }
  }

  if (editing) {
    return (
      <form onSubmit={handleSave} className="py-4 border-b border-gold/10 space-y-3">
        <select value={action} onChange={(e) => handleActionChange(e.target.value)} className={fieldClass}>
          <option value={action} className="bg-lodge">
            {action}
          </option>
          {pointValues
            .filter((pv) => pv.action !== action)
            .map((pv) => (
              <option key={pv.action} value={pv.action} className="bg-lodge">
                {pv.action} ({pv.points >= 0 ? "+" : ""}
                {pv.points})
              </option>
            ))}
        </select>
        <div className="flex gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={fieldClass}
          />
          <input
            type="number"
            step="0.5"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className={fieldClass}
          />
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          className={fieldClass}
        />
        {rowError && <p className="text-xs text-purpleLight">{rowError}</p>}
        <div className="flex gap-4 pt-1">
          <button
            type="submit"
            disabled={busy}
            className="text-xs tracking-[0.15em] uppercase text-gold hover:text-goldBright transition-colors disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={busy}
            className="text-xs tracking-[0.15em] uppercase text-parchmentDim hover:text-goldBright transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="py-4 border-b border-gold/10">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-parchment text-sm">{entry.action}</p>
        <p className={`tabular-nums text-sm shrink-0 ${entry.points >= 0 ? "text-gold" : "text-purpleLight"}`}>
          {entry.points >= 0 ? "+" : ""}
          {entry.points}
        </p>
      </div>
      <div className="flex items-baseline justify-between gap-4 mt-1">
        <p className="text-parchmentDim text-xs">{entry.notes ? entry.notes : " "}</p>
        <p className="text-parchmentDim text-xs shrink-0">
          {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
          {entry.loggedBy ? ` · logged by ${entry.loggedBy}` : ""}
        </p>
      </div>
      {isAdmin && entry.row != null && (
        <div className="flex gap-4 mt-2">
          <button
            onClick={() => setEditing(true)}
            className="text-xs tracking-[0.15em] uppercase text-purpleLight hover:text-goldBright transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="text-xs tracking-[0.15em] uppercase text-purpleLight hover:text-goldBright transition-colors disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      )}
      {rowError && <p className="text-xs text-purpleLight mt-2">{rowError}</p>}
    </div>
  );
}

function BrotherPageInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const { status, brothers, pointValues, role, password, error, retry } = useBrothersData();

  if (status === "loading") {
    return <p className="text-parchmentDim text-sm py-6">Loading&hellip;</p>;
  }

  if (status === "error") {
    return <ErrorState message={error!} onRetry={retry} />;
  }

  const brother = brothers.find((b) => b.slug === slug) ?? null;

  if (!brother) {
    return (
      <div>
        <Link href="/" className="text-sm text-purpleLight hover:text-goldBright transition-colors">
          &larr; Back to the roll
        </Link>
        <p className="text-parchmentDim text-sm py-6">Brother not found.</p>
      </div>
    );
  }

  const isAdmin = role === "admin";

  return (
    <div>
      <Link href="/" className="text-sm text-purpleLight hover:text-goldBright transition-colors">
        &larr; Back to the roll
      </Link>

      <div className="mt-8 mb-10">
        <p className="eyebrow text-gold/70 mb-2">Brother</p>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-4xl text-parchment">{brother.name}</h2>
          <p className="font-display text-2xl text-gold tabular-nums shrink-0">
            {brother.total % 1 === 0 ? brother.total : brother.total.toFixed(1)}
            <span className="text-sm text-parchmentDim ml-1 font-body">pts</span>
          </p>
        </div>
      </div>

      <p className="eyebrow text-parchmentDim mb-3">History</p>
      <div className="rule-double" />
      {brother.history.map((entry, i) => (
        <HistoryRow
          key={entry.row ?? i}
          entry={entry}
          brotherName={brother.name}
          isAdmin={isAdmin}
          password={password}
          pointValues={pointValues}
          onChanged={retry}
        />
      ))}

      {brother.history.length === 0 && (
        <p className="text-parchmentDim text-sm py-6">No entries logged yet.</p>
      )}
    </div>
  );
}

export default function BrotherPage() {
  return (
    <Suspense fallback={<p className="text-parchmentDim text-sm py-6">Loading&hellip;</p>}>
      <BrotherPageInner />
    </Suspense>
  );
}
