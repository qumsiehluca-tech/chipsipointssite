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
        <p className="eyebrow text-gold/70 mb-2">Standings</p>
        <h2 className="font-display text-4xl text-parchment mb-3">The Roll</h2>
        <p className="text-parchmentDim text-sm max-w-md leading-relaxed">
          Every brother&apos;s current standing, tallied from the points log. Select a name for
          their full history.
        </p>
      </div>

      <div className="rule-double" />

      {brothers === null && <p className="text-parchmentDim text-sm py-6">Loading&hellip;</p>}

      {brothers?.map((b, i) => (
        <Link key={b.slug} href={`/brother?slug=${b.slug}`} className="group flex items-baseline border-b border-gold/10">
          <span className="font-display italic text-gold/80 group-hover:text-gold w-10 shrink-0 text-base tabular-nums py-4 border-r border-gold/10 transition-colors">
            {i + 1}
          </span>
          <span className="font-display text-lg text-parchment group-hover:text-goldBright transition-colors flex-1 py-4 pl-5">
            {b.name}
          </span>
          <span className="font-body text-parchmentDim text-sm tabular-nums py-4 pr-1">
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
