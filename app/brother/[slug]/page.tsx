import Link from "next/link";
import { notFound } from "next/navigation";
import { getBrothers, getBrotherBySlug } from "@/lib/data";

export async function generateStaticParams() {
  const brothers = await getBrothers();
  return brothers.map((b) => ({ slug: b.slug }));
}

export default async function BrotherPage({
  params
}: {
  params: { slug: string };
}) {
  const brother = await getBrotherBySlug(params.slug);
  if (!brother) notFound();

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
              {entry.notes ? entry.notes : "\u00A0"}
            </p>
            <p className="text-parchmentDim text-xs shrink-0">
              {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
              {entry.loggedBy ? ` \u00B7 logged by ${entry.loggedBy}` : ""}
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
