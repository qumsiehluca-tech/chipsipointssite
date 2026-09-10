"use client";

import { useEffect, useState } from "react";
import { getStoredAuth } from "@/lib/auth";
import { fetchAuthed } from "@/lib/data";
import type { Brother, PointValue } from "@/lib/types";
import AdminLogForm from "./AdminLogForm";

export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  const [brothers, setBrothers] = useState<Brother[]>([]);
  const [pointValues, setPointValues] = useState<PointValue[]>([]);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) return;
    setPassword(auth.password);
    fetchAuthed(auth.password).then((data) => {
      if (!data) return;
      setBrothers(data.brothers);
      if (data.pointValues) setPointValues(data.pointValues);
    });
  }, []);

  return (
    <div>
      <p className="eyebrow text-gold/70 mb-2">Admin</p>
      <h2 className="font-display text-4xl text-parchment mb-3">Log Points</h2>
      <p className="text-parchmentDim text-sm max-w-md mb-10 leading-relaxed">
        Select one or more brothers, pick an action, and submit — this writes directly to the
        Log sheet and every total updates immediately.
      </p>
      {password && (
        <AdminLogForm
          password={password}
          brothers={brothers.map((b) => b.name)}
          pointValues={pointValues}
          onLogged={setBrothers}
        />
      )}
    </div>
  );
}
