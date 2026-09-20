# Meow Doku Puzzle Solver

A single-page solver for Meow Doku puzzles. Enter the grid, get the solution.

**Live:** https://meowdoku-puzzle-solver.vercel.app

## Stack

Zero dependencies, zero build step — the whole app is one self-contained
`index.html` (inline CSS + inline JS). The only external request is Google
Fonts.

## Local development

Open the file directly:

```
open index.html
```

Or serve it over HTTP, which more closely matches production:

```
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Deployment

Hosted on Vercel as a static site, connected to this repository. Pushes to
`main` deploy to production automatically; pull requests get preview URLs.

`vercel.json` holds the hosting configuration:

- `cleanUrls` / `trailingSlash` — canonical URLs without `.html` extensions
- security headers — CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy`
- `Cache-Control` on `index.html` so updates are picked up immediately
  instead of being served stale from cache

The CSP allows inline `<style>` and `<script>` because the app deliberately
keeps everything in one file. If the inline JS is ever moved to an external
file, tighten `script-src` by dropping `'unsafe-inline'`.
