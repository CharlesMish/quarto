# Hosting

Quarto is a single-canvas Babylon.js static app. There is no client-side router and no SPA fallback.

## Cloudflare Workers Builds

GitHub-connected Cloudflare Workers Builds should:

1. `npm ci`
2. `npm run build` (`tsc --noEmit -p tsconfig.app.json && vite build`)
3. wrangler-deploy `dist/`

`wrangler.jsonc` serves `./dist` with `html_handling: "drop-trailing-slash"`. `workers_dev` is on so `main` has an https URL before any custom domain.

## URLs

- Preview URLs are the phone-test gate.
- The intended future URL `https://quarto.cmish.dev/` is **not** attached. Do not add `custom_domain` or `routes`.

## Secrets

Never commit Cloudflare tokens or other credentials. Configure account credentials in the Cloudflare dashboard / CI secrets, not in this repository.
