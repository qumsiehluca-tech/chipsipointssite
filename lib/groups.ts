export type BrotherGroup = { id: string; name: string; members: string[] };

const GROUPS_KEY = "cp_groups";

/** Saved brother groups for the bulk-log form. Stored per browser (localStorage), not in the sheet. */
export function readGroups(): BrotherGroup[] {
  try {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (g): g is BrotherGroup =>
        typeof g?.id === "string" && typeof g?.name === "string" && Array.isArray(g?.members)
    );
  } catch {
    return [];
  }
}

export function writeGroups(groups: BrotherGroup[]) {
  try {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  } catch {
    // storage unavailable — groups just won't persist
  }
}
