"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearStoredAuth, getStoredAuth } from "./auth";
import { fetchAuthed } from "./data";
import type { Brother, PointValue, Role } from "./types";

type State = {
  status: "loading" | "error" | "ready";
  brothers: Brother[];
  pointValues: PointValue[];
  role: Role | null;
  password: string | null;
  error: string | null;
};

const INITIAL_STATE: State = {
  status: "loading",
  brothers: [],
  pointValues: [],
  role: null,
  password: null,
  error: null
};

/**
 * Loads the roster once auth is present, and gives every page the same
 * loading / error / retry behavior instead of hanging on "Loading…"
 * forever if the backend is unreachable or the stored password goes stale.
 */
export function useBrothersData() {
  const router = useRouter();
  const [state, setState] = useState<State>(INITIAL_STATE);

  const load = useCallback(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.replace("/login");
      return;
    }

    setState((s) => ({ ...s, status: "loading", error: null }));

    fetchAuthed(auth.password).then((result) => {
      if (result.ok) {
        setState({
          status: "ready",
          brothers: result.data.brothers,
          pointValues: result.data.pointValues || [],
          role: result.data.role,
          password: auth.password,
          error: null
        });
      } else if (result.reason === "unauthorized") {
        clearStoredAuth();
        router.replace("/login");
      } else {
        setState((s) => ({
          ...s,
          status: "error",
          error: "Couldn't reach the points backend. Check your connection and try again."
        }));
      }
    });
  }, [router]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ...state, retry: load, setBrothers: (brothers: Brother[]) => setState((s) => ({ ...s, brothers })) };
}
