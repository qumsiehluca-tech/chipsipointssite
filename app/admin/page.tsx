"use client";

import { useBrothersData } from "@/lib/useBrothersData";
import ErrorState from "../ErrorState";
import AdminLogForm from "./AdminLogForm";
import AddBrotherForm from "./AddBrotherForm";

export default function AdminPage() {
  const { status, brothers, pointValues, password, error, retry } = useBrothersData();

  return (
    <div>
      <p className="eyebrow text-gold/70 mb-2">Admin</p>
      <h2 className="font-display text-4xl text-parchment mb-3">Log Points</h2>
      <p className="text-parchmentDim text-sm max-w-md mb-10 leading-relaxed">
        Select one or more brothers, pick an action, and submit — this writes directly to the
        Log sheet and every total updates immediately.
      </p>

      {status === "loading" && <p className="text-parchmentDim text-sm py-6">Loading&hellip;</p>}
      {status === "error" && <ErrorState message={error!} onRetry={retry} />}

      {status === "ready" && password && (
        <>
          <AddBrotherForm password={password} onAdded={retry} />
          <AdminLogForm
            password={password}
            brothers={brothers.map((b) => b.name)}
            pointValues={pointValues}
            onLogged={retry}
          />
        </>
      )}
    </div>
  );
}
