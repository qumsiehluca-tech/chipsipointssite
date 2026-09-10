# Alpha Nu Tau — Chi Psi Points Site

A Next.js site showing the brother leaderboard and each brother's point history.
Right now it runs on mock data in `lib/data.ts` — swap that for the live Google
Sheet once the Apps Script backend is ready (see below).

## Run it locally

You'll need [Node.js](https://nodejs.org) (18 or newer) installed.

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Project structure

- `app/page.tsx` — the leaderboard ("The Roll")
- `app/brother/[slug]/page.tsx` — one brother's full point history
- `lib/data.ts` — **the only file that touches data.** Everything else reads
  through `getBrothers()` / `getBrotherBySlug()`. This is where you'll plug in
  the real Google Sheet later.
- `tailwind.config.ts` — the color tokens (purple/gold) and fonts, in one place

## Connecting the real Google Sheet

Once the Apps Script web app from the points workbook is deployed, it'll give
you a URL like `https://script.google.com/macros/s/XXXXXXX/exec`. Put that in
a `.env.local` file:

```
SHEETS_API_URL=https://script.google.com/macros/s/XXXXXXX/exec
```

Then replace the body of `getBrothers()` in `lib/data.ts` with a real fetch —
there's a comment in that file showing exactly what that looks like. Nothing
in the page files needs to change.

## Deploying it for real (chipsi-style free hosting)

1. Create a new repo on GitHub and push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com), sign in with GitHub, click "Add New
   Project," and select the repo. Leave the defaults — Vercel auto-detects
   Next.js.
3. Once it's live, add `SHEETS_API_URL` under Project Settings → Environment
   Variables so the deployed site (not just your laptop) can reach the sheet.
4. Every time you `git push`, the live site updates automatically.

If you'd rather host on GitHub Pages under a `chipsi.org` subdomain instead of
Vercel, say the word — it needs a couple of config tweaks since GitHub Pages
serves static files only, and this app currently expects a small server for
the live-data fetch.
