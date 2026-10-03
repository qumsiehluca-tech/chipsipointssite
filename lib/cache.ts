import type { ApiPayload } from "./data";

const CACHE_KEY = "cp_cache";

/** Last backend payload, kept so pages can paint instantly and refresh in the background. */
export function readCache(): ApiPayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.brothers) && (parsed.role === "admin" || parsed.role === "viewer")) {
      return parsed as ApiPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeCache(payload: ApiPayload) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // storage full or unavailable — caching is only an optimization
  }
}

export function clearCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}
