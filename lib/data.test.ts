import { describe, expect, it } from "vitest";
import { mergeRosterWithLog, slugify } from "./data";

describe("slugify", () => {
  it("lowercases and hyphenates a normal name", () => {
    expect(slugify("Jordan Smith")).toBe("jordan-smith");
  });

  it("strips punctuation and collapses repeated separators", () => {
    expect(slugify("  O'Brien -- Jr.  ")).toBe("o-brien-jr");
  });

  it("has no leading or trailing hyphen", () => {
    expect(slugify("!Franco Palombo!")).toBe("franco-palombo");
  });
});

describe("mergeRosterWithLog", () => {
  // Regression test: getBrothers_() in Code.gs originally derived the whole
  // brother list from unique Log names only, so anyone with zero point
  // events (i.e. most of a freshly-populated roster) never appeared on the
  // site at all. mergeRosterWithLog is the frontend mirror of the fix.
  it("includes every roster name even when they have no log rows", () => {
    const roster = ["Alberto Ibarra", "Franco Palombo", "Jake Gaunaurd"];
    const logNames = ["Franco Palombo"]; // only one of the three has history

    const merged = mergeRosterWithLog(roster, logNames);

    expect(merged).toContain("Alberto Ibarra");
    expect(merged).toContain("Jake Gaunaurd");
  });

  it("does not duplicate a name that's in both the roster and the log", () => {
    const merged = mergeRosterWithLog(["Franco Palombo"], ["Franco Palombo"]);
    expect(merged.filter((n) => n === "Franco Palombo")).toHaveLength(1);
  });

  it("still includes a log-only name (e.g. a brother removed from the roster after the fact)", () => {
    const merged = mergeRosterWithLog(["Alberto Ibarra"], ["Someone Departed"]);
    expect(merged).toContain("Someone Departed");
  });

  it("preserves roster order and appends log-only names at the end", () => {
    const merged = mergeRosterWithLog(["B", "A"], ["A", "C"]);
    expect(merged).toEqual(["B", "A", "C"]);
  });
});
