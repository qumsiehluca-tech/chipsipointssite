"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getStoredAuth } from "@/lib/auth";
import { fetchAuthed } from "@/lib/data";
import type { Brother } from "@/lib/types";

export default function LeaderboardPage() {
  const [brothers, setBrothers] = useState<Brother[] | null>(null);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) return;
    fetchAuthed(auth.password).then((data) => {
      if (data) setBrothers(data.brothers);
    });
  }, []);

  return (
    <div>
      <div className="mb-10">
        <h2 className="font-display text-3xl text-parchment mb-2">The Roll</h2>
        <p className="text-parchmentDim text-sm max-w-md">
          Every brother&apos;s current standing, tallied from the points log. Select a name for
          their full history.
        </p>
      </div>

      <div className="rule" />

      {brothers === null && <p className="text-parchmentDim text-sm py-6">Loading&hellip;</p>}

      {brothers?.map((b, i) => (
        <Link
          key={b.slug}
          href={`/brother?slug=${b.slug}`}
          className="group flex items-baseline gap-4 py-4 border-b border-gold/10 hover:bg-lodge/60 -mx-4 px-4 transition-colors"
        >
          <span className="font-display italic text-gold w-8 shrink-0 text-lg tabular-nums">
            {i + 1}
          </span>
          <span className="font-display text-lg text-parchment group-hover:text-goldBright transition-colors flex-1">
            {b.name}
          </span>
          <span className="font-body text-parchmentDim text-sm tabular-nums">
            {b.total % 1 === 0 ? b.total : b.total.toFixed(1)} pts
          </span>
        </Link>
      ))}

      {brothers?.length === 0 && (
        <p className="text-parchmentDim text-sm py-6">
          No brothers logged yet. Once entries are added to the Log sheet, they&apos;ll appear here.
        </p>
      )}
    </div>
  );
}
