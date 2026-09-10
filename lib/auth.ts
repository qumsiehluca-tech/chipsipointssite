import type { Role } from "./types";

const STORAGE_KEY = "cp_auth";

export type StoredAuth = { password: string; role: Role };

export function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.password && (parsed.role === "admin" || parsed.role === "viewer")) {
      return parsed as StoredAuth;
    }
    return null;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: StoredAuth) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(STORAGE_KEY);
}
