# Alpha Nu Tau — Chi Psi Points Site

A Next.js site showing the brother leaderboard and each brother's point history,
gated behind a site-wide password (two levels: admin and viewer). Right now it
runs on mock data in `lib/data.ts` — swap that for the live Google Sheet once
the Apps Script backend is deployed (see below).

**Important — this needs a real Node server, not GitHub Pages.** Pages only
serves static files; this app has a login flow, cookie-based session gating,
and API routes that all require a server. Host it on Vercel instead (see
"Deploying it for real" below) — if GitHub Pages is currently enabled on this
repo, turn it off in Settings → Pages so it doesn't keep serving the raw
README as a confusing placeholder.

## Run it locally

You'll need [Node.js](https://nodejs.org) (18 or newer) installed.

```bash
npm install
npm run dev
```

Then open http://localhost:3000. Without `SHEETS_API_URL` set, the dev
passwords are `admin` and `viewer`, and writes go to an in-memory mock log
(resets whenever the dev server restarts) — enough to click through the whole
flow before the real sheet is wired up.

## Project structure

- `app/page.tsx` — the leaderboard ("The Roll")
- `app/brother/[slug]/page.tsx` — one brother's full point history
- `app/admin/` — admin-only bulk point-logging panel (multi-select brothers,
  action, points, notes)
- `app/login/page.tsx`, `middleware.ts`, `app/api/login|logout|log/route.ts` —
  the site-wide password gate. `middleware.ts` blocks every route except
  `/login` unless a valid session cookie is present; `/admin` additionally
  requires the admin role.
- `lib/data.ts` — **the only file that touches data.** Everything reads
  through `getBrothers()` / `getBrotherBySlug()` / `getPointValues()`, and
  admin writes go through `submitLogEntries()`.
- `tailwind.config.ts` — the color tokens (purple/gold) and fonts, in one place
- `google-apps-script/Code.gs` — the backend that attaches to the Google
  Sheet itself (see below)

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
   SHEETS_API_URL=https://script.google.com/macros/s/XXXXXXX/exec
   ```
   and add the same variable in Vercel (Project Settings → Environment
   Variables) so the deployed site can reach it too.

Every time you edit Code.gs in the Apps Script editor, you need to create a
**new deployment** (or edit the existing one's version) for changes to go live
— saving alone doesn't redeploy the web app.

## Deploying it for real (Vercel)

1. This repo is already pushed to GitHub.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click "Add New
   Project," and select this repo. Leave the defaults — Vercel auto-detects
   Next.js.
3. Add `SHEETS_API_URL` under Project Settings → Environment Variables (same
   value as your `.env.local`).
4. Every time you `git push`, the live site updates automatically.
