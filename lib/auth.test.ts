import { beforeEach, describe, expect, it } from "vitest";
import { clearStoredAuth, getStoredAuth, setStoredAuth } from "./auth";

describe("auth storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing is stored", () => {
    expect(getStoredAuth()).toBeNull();
  });

  it("round-trips a stored password and role", () => {
    setStoredAuth({ password: "test-admin-pw", role: "admin" });
    expect(getStoredAuth()).toEqual({ password: "test-admin-pw", role: "admin" });
  });

  it("clears stored auth", () => {
    setStoredAuth({ password: "test-viewer-pw", role: "viewer" });
    clearStoredAuth();
    expect(getStoredAuth()).toBeNull();
  });

  it("rejects corrupted JSON in localStorage instead of throwing", () => {
    localStorage.setItem("cp_auth", "{not valid json");
    expect(getStoredAuth()).toBeNull();
  });

  it("rejects a stored value with an invalid role", () => {
    localStorage.setItem("cp_auth", JSON.stringify({ password: "x", role: "superuser" }));
    expect(getStoredAuth()).toBeNull();
  });

  it("rejects a stored value missing a password", () => {
    localStorage.setItem("cp_auth", JSON.stringify({ role: "admin" }));
    expect(getStoredAuth()).toBeNull();
  });
});
