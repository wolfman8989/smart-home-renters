# Smart Home for Renters

Micro-niche affiliate content site: `https://smarthomerent.casa`

Smart home devices that work in a rental — no drilling, no landlord
permission, take them with you when you move.

## Stack

- Plain static HTML/CSS, no client JavaScript.
- Markdown sources in `content/*.md` rendered by `build.js` (marked) into
  full standalone HTML pages in `articles/`.
- Hosted on Cloudflare Pages; DNS on Cloudflare.
- Amazon Associates tag: `smarthomerent-20`.

## Build locally

```bash
npm install marked
node build.js
```

`build.js` is the deploy gate: it exits non-zero and prints
`BROKEN INTERNAL LINKS` if any internal `href`/`src` does not resolve.

## Deploy

```bash
npx wrangler pages deploy . --project-name=smarthomerent
```

## Automated deploy (GitHub Actions)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`,
on a weekly schedule, and on manual trigger.

Required repository secrets:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with Pages Edit permission.
- `CLOUDFLARE_ACCOUNT_ID` — `bbbc965faf5e026fe2a20c120932c5e2`.

## Product photos

Only real manufacturer/CDN photos are used. `![Name](#photo)` markers in the
markdown resolve through the `PHOTOS` map in `build.js` (keyed on lowercase
alt text). A marker with no matching key renders nothing — by design, an
unrelated stock photo is worse than no photo.
