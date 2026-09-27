# Alpha Nu Tau — Chi Psi Points Site

A Next.js site showing the brother leaderboard and each brother's point history,
gated behind a site-wide password (two levels: admin and viewer). Right now it
runs on mock data in `lib/data.ts` — swap that for the live Google Sheet once
the Apps Script backend is deployed (see below).

This is a fully static, client-rendered app (`output: "export"` in
`next.config.mjs`) so it can be hosted for free on **GitHub Pages** — no
server needed. The login gate and admin panel run entirely in the browser and
talk directly to the Google Apps Script backend; the real security check
(passwords) happens server-side inside Apps Script, never in this site's code.

## Run it locally

You'll need [Node.js](https://nodejs.org) (18 or newer) installed.

```bash
npm install
npm run dev
```

Then open http://localhost:3000/chipsipointssite/ (the `basePath` in
`next.config.mjs` applies locally too, since the site is deployed under
`github.io/chipsipointssite/`). Without `NEXT_PUBLIC_SHEETS_API_URL` set, the
dev passwords are `admin` and `viewer`, and the roster/log live in an
in-memory mock (resets on every full page reload, since it's just JS arrays
in the browser) — enough to click through logging points, editing/deleting
an entry, and adding a brother before the real sheet is wired up.

## Project structure

- `app/page.tsx` — the leaderboard ("The Roll")
- `app/brother/page.tsx` — one brother's full point history, read via a
  `?slug=` query param (not a dynamic route segment, since a static export
  can't pre-render slugs it doesn't know about at build time). Admins get
  inline **Edit** / **Delete** controls on each history entry here.
- `app/admin/` — admin-only panel: **Add a brother** (writes a new Leaderboard
  row and duplicates the Template tab for them) and the bulk point-logging
  form (multi-select brothers, action, points, notes)
- `app/login/page.tsx`, `app/AuthGate.tsx`, `lib/auth.ts` — the site-wide
  password gate. `AuthGate` wraps every page and redirects to `/login` unless
  a valid session is in `localStorage`; `/admin` additionally requires the
  admin role.
- `lib/data.ts` — **the only file that touches data.** Everything reads
  through `fetchAuthed()`; admin writes go through `postLogEntries()`,
  `updateLogEntry()`, `deleteLogEntry()`, and `addBrother()`.
- `lib/useBrothersData.ts` — shared loading/error/retry state for every page
  that needs the roster. If the backend is unreachable, or a stored password
  goes stale (e.g. you rotate the Script Properties), pages show a **Retry**
  button or bounce back to `/login` instead of hanging on "Loading…" forever.
- `tailwind.config.ts` — the color tokens (purple/gold) and fonts, in one place
- `google-apps-script/Code.gs` — the backend that attaches to the Google
  Sheet itself (see below)
- `.github/workflows/deploy.yml` — runs tests, then builds and deploys to
  GitHub Pages automatically on every push to `main`
- `lib/*.test.ts` — unit tests (see "Tests" below)

## Setting up the Google Sheet + Apps Script backend

1. Import `Chi_Psi_Points_System.xlsx` into Google Sheets (File → Import →
   Upload, "Replace spreadsheet" or create new — either way the formulas
   convert automatically).
2. In that Sheet, open Extensions → Apps Script, delete the placeholder
   `Code.gs` content, and paste in this repo's `google-apps-script/Code.gs`.
3. In the Apps Script project, go to Project Settings → Script Properties and
   add two properties: `ADMIN_PASSWORD` and `VIEWER_PASSWORD`, with whatever
   passwords you and Sasha want to use. These never appear in the source code
   or in the website's client-side JS — only the deployed script checks them.
4. Deploy → New deployment → type "Web app" → execute as "Me" → who has
   access "Anyone". Copy the `/exec` URL it gives you.
5. Put that URL in a `.env.local` file for local testing:
   ```
   NEXT_PUBLIC_SHEETS_API_URL=https://script.google.com/macros/s/XXXXXXX/exec
   ```

Every time you edit Code.gs in the Apps Script editor, you need to create a
**new deployment** (or edit the existing one's version) for changes to go live
— saving alone doesn't redeploy the web app.

## Tests

```bash
npm test
```

Runs [Vitest](https://vitest.dev) against the pure logic in `lib/` — notably
`mergeRosterWithLog` (which brothers show up on the site) and the
`localStorage` session round-trip in `lib/auth.ts`. The `mergeRosterWithLog`
tests exist because of a real bug: the backend originally listed brothers
from Log rows only, so anyone with zero points (i.e. most of a freshly
populated roster) never showed up at all. If you change that merge logic
here, make the matching change to `getBrothers_()` in
`google-apps-script/Code.gs` — Apps Script can't run in this test suite, so
that half has to be kept in sync by hand.

`npm test` also runs automatically in CI (`.github/workflows/deploy.yml`)
before every build, so a broken test blocks deployment.

## Deploying it for real (GitHub Pages)

One-time setup:

1. In this repo, go to Settings → Pages → Source, and set it to **"GitHub
   Actions"** (not "Deploy from a branch" — that's what was showing the raw
   README before).
2. Go to Settings → Secrets and variables → Actions → **Variables** tab, and
   add a repository variable named `NEXT_PUBLIC_SHEETS_API_URL` with your
   Apps Script `/exec` URL from above. (It's a Variable, not a Secret — the
   URL itself isn't sensitive, since Apps Script checks the password on every
   request regardless of who calls it.)

After that, every `git push` to `main` triggers `.github/workflows/deploy.yml`,
which builds the site and publishes it to
`https://qumsiehluca-tech.github.io/chipsipointssite/` automatically — no
manual deploy step.

If you'd rather host on Vercel (e.g. once you're ready to move to a
`chipsi.org` subdomain), that needs the server-rendered version of this app
back (cookie-based session, API routes) instead of this static export — say
the word and it can be switched.
