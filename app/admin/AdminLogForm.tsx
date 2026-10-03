"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { postLogEntries } from "@/lib/data";
import { readGroups, writeGroups, type BrotherGroup } from "@/lib/groups";
import type { PointValue } from "@/lib/types";
import ActionSelect from "./ActionSelect";

const ALL = "all";
const CUSTOM = "custom";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 text-[0.7rem] tracking-[0.14em] uppercase border transition-colors ${
        active
          ? "border-gold bg-gold text-ink"
          : "border-gold/30 text-parchmentDim hover:border-gold/70 hover:text-goldBright"
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminLogForm({
  password,
  brothers,
  pointValues,
  onLogged
}: {
  password: string;
  brothers: string[];
  pointValues: PointValue[];
  onLogged: () => void;
}) {
  const [groups, setGroups] = useState<BrotherGroup[]>([]);
  // "all" follows the live roster; a saved group id selects that group; "custom" uses `custom` below.
  const [groupId, setGroupId] = useState<string>(ALL);
  const [custom, setCustom] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupMessage, setGroupMessage] = useState<string | null>(null);
  const [action, setAction] = useState(pointValues[0]?.action ?? "");
  const [points, setPoints] = useState(pointValues[0]?.points ?? 0);
  const [notes, setNotes] = useState("");
  const [loggedBy, setLoggedBy] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setGroups(readGroups());
  }, []);

  const activeGroup = groups.find((g) => g.id === groupId);
  const selected =
    groupId === ALL
      ? brothers
      : activeGroup
        ? brothers.filter((n) => activeGroup.members.includes(n))
        : brothers.filter((n) => custom.includes(n));

  function toggleBrother(name: string) {
    const next = selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name];
    setCustom(brothers.filter((n) => next.includes(n)));
    setGroupId(CUSTOM);
    setGroupMessage(null);
  }

  function selectNone() {
    setCustom([]);
    setGroupId(CUSTOM);
    setGroupMessage(null);
  }

  function saveGroup() {
    const name = groupName.trim();
    if (!name || selected.length === 0) return;
    if (name.toLowerCase() === "all" || name.toLowerCase() === "none") {
      setGroupMessage(`"${name}" is a built-in name — pick another.`);
      return;
    }
    const existing = groups.find((g) => g.name.toLowerCase() === name.toLowerCase());
    const id = existing ? existing.id : `g-${Date.now()}`;
    const next: BrotherGroup[] = existing
      ? groups.map((g) => (g.id === id ? { ...g, members: selected } : g))
      : [...groups, { id, name, members: selected }];
    setGroups(next);
    writeGroups(next);
    setGroupId(id);
    setGroupName("");
    setGroupMessage(existing ? `Updated "${existing.name}".` : `Saved group "${name}".`);
  }

  function deleteGroup(group: BrotherGroup) {
    if (!window.confirm(`Delete the group "${group.name}"? Brothers aren't affected.`)) return;
    const next = groups.filter((g) => g.id !== group.id);
    setGroups(next);
    writeGroups(next);
    setCustom(selected);
    setGroupId(CUSTOM);
    setGroupMessage(null);
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
    const result = await postLogEntries(password, entries);

    setSubmitting(false);
    if (result.ok) {
      setStatus(`Logged for ${selected.length} brother${selected.length > 1 ? "s" : ""}.`);
      onLogged();
      selectNone();
      setNotes("");
    } else {
      setStatus(result.error);
    }
  }

  const fieldClass =
    "w-full bg-transparent border-b border-gold/25 rounded-none px-1 py-3 text-parchment placeholder:text-parchmentDim/50 focus:outline-none focus:border-gold transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div>
        <p className="eyebrow text-parchmentDim mb-3">Brothers ({selected.length} selected)</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <Chip active={groupId === ALL} onClick={() => { setGroupId(ALL); setGroupMessage(null); }}>
            All ({brothers.length})
          </Chip>
          {groups.map((g) => (
            <Chip key={g.id} active={groupId === g.id} onClick={() => { setGroupId(g.id); setGroupMessage(null); }}>
              {g.name} ({brothers.filter((n) => g.members.includes(n)).length})
            </Chip>
          ))}
          <Chip active={groupId === CUSTOM && selected.length === 0} onClick={selectNone}>
            None
          </Chip>
        </div>

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

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Name this selection to save it as a group"
            className={`${fieldClass} sm:flex-1 text-sm`}
          />
          <button
            type="button"
            onClick={saveGroup}
            disabled={!groupName.trim() || selected.length === 0}
            className="border border-gold/40 text-gold hover:bg-gold hover:text-ink transition-colors text-[0.7rem] tracking-[0.14em] uppercase px-4 py-2.5 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gold"
          >
            Save group
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 min-h-[1.25rem]">
          {groupMessage && <p className="text-xs text-gold">{groupMessage}</p>}
          {activeGroup && (
            <button
              type="button"
              onClick={() => deleteGroup(activeGroup)}
              className="text-xs text-purpleLight hover:text-goldBright transition-colors"
            >
              Delete group &quot;{activeGroup.name}&quot;
            </button>
          )}
        </div>
        <p className="text-xs text-parchmentDim/70 mt-1">
          Groups are saved in this browser only. Saving with an existing name updates that group.
        </p>
      </div>

      <div>
        <label className="eyebrow block text-parchmentDim mb-3">Action</label>
        <ActionSelect
          value={action}
          onChange={handleActionChange}
          options={pointValues.map((pv) => ({
            value: pv.action,
            label: `${pv.action} (${pv.points >= 0 ? "+" : ""}${pv.points})`
          }))}
        />
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
