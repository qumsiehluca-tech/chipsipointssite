"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getStoredAuth } from "@/lib/auth";
import { fetchAuthed } from "@/lib/data";
import type { Brother } from "@/lib/types";

function BrotherPageInner() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");
  const [brother, setBrother] = useState<Brother | null | undefined>(undefined);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth || !slug) return;
    fetchAuthed(auth.password).then((data) => {
      if (!data) return;
      setBrother(data.brothers.find((b) => b.slug === slug) ?? null);
    });
  }, [slug]);

  if (brother === undefined) {
    return <p className="text-parchmentDim text-sm py-6">Loading&hellip;</p>;
  }

  if (brother === null) {
    return (
      <div>
        <Link href="/" className="text-sm text-purpleLight hover:text-goldBright transition-colors">
          &larr; Back to the roll
        </Link>
        <p className="text-parchmentDim text-sm py-6">Brother not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/" className="text-sm text-purpleLight hover:text-goldBright transition-colors">
        &larr; Back to the roll
      </Link>

      <div className="mt-6 mb-10 flex items-baseline justify-between">
        <h2 className="font-display text-3xl text-parchment">{brother.name}</h2>
        <p className="font-display text-2xl text-gold tabular-nums">
          {brother.total % 1 === 0 ? brother.total : brother.total.toFixed(1)}
          <span className="text-sm text-parchmentDim ml-1 font-body">pts</span>
        </p>
      </div>

      <h3 className="font-display italic text-lg text-parchmentDim mb-4">History</h3>
      <div className="rule" />
      {brother.history.map((entry, i) => (
        <div key={i} className="py-4 border-b border-gold/10">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-parchment text-sm">{entry.action}</p>
            <p
              className={`tabular-nums text-sm shrink-0 ${
                entry.points >= 0 ? "text-gold" : "text-purpleLight"
              }`}
            >
              {entry.points >= 0 ? "+" : ""}
              {entry.points}
            </p>
          </div>
          <div className="flex items-baseline justify-between gap-4 mt-1">
            <p className="text-parchmentDim text-xs">
              {entry.notes ? entry.notes : " "}
            </p>
            <p className="text-parchmentDim text-xs shrink-0">
              {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
              {entry.loggedBy ? ` · logged by ${entry.loggedBy}` : ""}
            </p>
          </div>
        </div>
      ))}

      {brother.history.length === 0 && (
        <p className="text-parchmentDim text-sm py-6">No entries logged yet.</p>
      )}
    </div>
  );
}

export default function BrotherPage() {
  return (
    <Suspense fallback={<p className="text-parchmentDim text-sm py-6">Loading&hellip;</p>}>
      <BrotherPageInner />
    </Suspense>
  );
}
