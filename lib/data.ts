import type { Brother } from "./types";

// ---------------------------------------------------------------------------
// DATA SOURCE
//
// Right now this file returns hardcoded mock data so the site has something
// real to render while the Google Apps Script backend is being built.
//
// Once the Apps Script web app is live, replace the body of getBrothers()
// with a fetch to it, e.g.:
//
//   const res = await fetch(process.env.SHEETS_API_URL!, {
//     next: { revalidate: 60 }, // re-fetch at most once a minute
//   });
//   const data = await res.json();
//   return data.brothers as Brother[];
//
// Nothing else in the app needs to change — every page reads through
// getBrothers() / getBrotherBySlug(), never straight from mock data.
// ---------------------------------------------------------------------------

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RAW: { name: string; history: { date: string; action: string; points: number; notes?: string; loggedBy?: string }[] }[] = [
  {
    name: "Example Brother",
    history: [
      {
        date: "2026-08-25",
        action: "Bringing a PNM who accepts a bid to Lodge",
        points: 5,
        notes: "Example row — replace once the Log sheet is live",
        loggedBy: "Admin"
      },
      {
        date: "2026-08-28",
        action: "Holding a non exec position",
        points: 2.5,
        loggedBy: "Admin"
      }
    ]
  },
  {
    name: "Lorenzo Patrizio",
    history: [
      { date: "2026-08-21", action: "Exceptional Contributor bonus", points: 25, loggedBy: "Admin" }
    ]
  }
];

export async function getBrothers(): Promise<Brother[]> {
  const brothers: Brother[] = RAW.map((b) => ({
    slug: slugify(b.name),
    name: b.name,
    total: b.history.reduce((sum, h) => sum + h.points, 0),
    history: [...b.history].sort((a, c) => (a.date < c.date ? 1 : -1))
  }));
  return brothers.sort((a, b) => b.total - a.total);
}

export async function getBrotherBySlug(slug: string): Promise<Brother | undefined> {
  const brothers = await getBrothers();
  return brothers.find((b) => b.slug === slug);
}
