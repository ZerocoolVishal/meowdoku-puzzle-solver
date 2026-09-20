# Meowdoku Puzzle Solver

Drop in a screenshot of a Meowdoku puzzle and get the answer — one cat at a
time, a few squares ruled out, or the whole board solved.

**Live:** https://meowdoku.vishalb.dev

## How it works

The solver reads the board straight out of the image: it finds the big block
of equal-sized coloured squares, samples each cell's colour to recover the
regions, then solves for the three rules —

1. One cat in every row and every column.
2. One cat in every colour region.
3. No two cats touching, including corner to corner.

Everything runs in the browser. The screenshot is read with `FileReader` into
a `data:` URL and drawn to a canvas; it is never uploaded to a server.

## Stack

Zero dependencies, zero build step — the whole app is one self-contained
`index.html` (inline CSS + inline JS). The only external request is Google
Fonts.

## Local development

```
python3 -m http.server 8000
```

Then visit http://localhost:8000. Serving over HTTP rather than opening the
file directly matches production and keeps the absolute asset paths
(`/favicon.svg`, `/site.webmanifest`) resolving correctly.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The entire application |
| `og-image.png` | 1200×630 social share card |
| `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` | Icons |
| `site.webmanifest` | PWA manifest — installable, themed |
| `robots.txt`, `sitemap.xml` | Crawler directives |
| `vercel.json` | Hosting config |
| `tools/og-image.html` | Source layout for the share card |

## SEO

`index.html` carries a descriptive title and meta description, keywords,
Open Graph and Twitter card tags pointing at `og-image.png`, and a
`rel=canonical` pointing at `https://meowdoku.vishalb.dev/`.

The canonical tag matters: the app is also reachable on its `*.vercel.app`
hostnames, and the canonical is what tells search engines to consolidate
ranking onto the custom domain instead of treating those as duplicates.

There is also a JSON-LD `@graph` describing the app as a `WebApplication`,
the author as a `Person`, and an `FAQPage` mirroring the on-page questions.

**If the canonical domain ever changes**, update it in all of these places:
`index.html` (canonical, `og:url`, `og:image`, `twitter:image`, and the
JSON-LD `@id`/`url`/`image` fields), `robots.txt`, and `sitemap.xml`.

## Deployment

Hosted on Vercel as a static site, connected to this repository. Pushes to
`main` deploy to production automatically; pull requests get preview URLs.

`vercel.json` holds the hosting configuration:

- `cleanUrls` / `trailingSlash` — canonical URLs without `.html` extensions
- security headers — CSP, `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options`, `Permissions-Policy`
- `Cache-Control` — `index.html` revalidates every request so updates appear
  immediately; images get a day of caching with a week of
  `stale-while-revalidate`

The CSP allows inline `<style>` and `<script>` because the app deliberately
keeps everything in one file, and allows `data:` images because that is how
the uploaded screenshot reaches the canvas. If the inline JS is ever moved to
an external file, tighten `script-src` by dropping `'unsafe-inline'`.

## Regenerating the share image

`og-image.png` is committed as an artifact — no build step produces it. The
source layout lives in `tools/og-image.html`; re-render it with headless
Chrome after editing:

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --virtual-time-budget=6000 --screenshot=og-image.png tools/og-image.html
```

The `--virtual-time-budget` matters: without it the screenshot can fire
before the Google Fonts webfonts finish loading, and the card renders in a
fallback typeface.
