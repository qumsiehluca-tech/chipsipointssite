import { beforeEach, describe, expect, it } from "vitest";
import { clearStoredAuth, setStoredAuth } from "./auth";
import { clearCache, readCache, writeCache } from "./cache";
import { readGroups, writeGroups } from "./groups";

const payload = { role: "viewer" as const, brothers: [{ slug: "a-b", name: "A B", total: 3, history: [] }] };

describe("payload cache", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips a payload", () => {
    writeCache(payload);
    expect(readCache()).toEqual(payload);
  });

  it("ignores corrupted or malformed cache entries", () => {
    localStorage.setItem("cp_cache", "{nope");
    expect(readCache()).toBeNull();
    localStorage.setItem("cp_cache", JSON.stringify({ role: "root", brothers: [] }));
    expect(readCache()).toBeNull();
  });

  it("is wiped when the user logs out, so a shared computer never shows the previous session's data", () => {
    setStoredAuth({ password: "test-viewer-pw", role: "viewer" });
    writeCache(payload);
    clearStoredAuth();
    expect(readCache()).toBeNull();
  });

  it("clearCache removes the entry", () => {
    writeCache(payload);
    clearCache();
    expect(readCache()).toBeNull();
  });
});

describe("saved groups", () => {
  beforeEach(() => localStorage.clear());

  it("round-trips groups", () => {
    const groups = [{ id: "g-1", name: "Execs", members: ["A B"] }];
    writeGroups(groups);
    expect(readGroups()).toEqual(groups);
  });

  it("drops malformed entries instead of throwing", () => {
    localStorage.setItem("cp_groups", JSON.stringify([{ id: "g-1", name: "Ok", members: [] }, { nope: true }]));
    expect(readGroups()).toEqual([{ id: "g-1", name: "Ok", members: [] }]);
    localStorage.setItem("cp_groups", "{bad");
    expect(readGroups()).toEqual([]);
  });
});
