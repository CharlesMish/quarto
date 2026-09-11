# Hosting

Quarto contains two Babylon.js applications with different purposes:

- the repository root is the MT1-S5HR3R1 engineering / authority viewer;
- `explore/body-shell-03/` is the reconciled Quarto presentation viewer intended for the public web edition.

The public Worker must serve the presentation viewer, not the root authority build.

## Cloudflare Workers Builds

GitHub-connected Cloudflare Workers Builds for the public `quarto` Worker should use:

1. Build command: `npm run build:public`
2. Deploy command: `npx wrangler deploy`

`npm run build:public` installs the presentation package with `npm ci` and builds its `dist/`. `wrangler.jsonc` serves `./explore/body-shell-03/dist` with `html_handling: "drop-trailing-slash"`.

For an explicit local deployment, run:

```bash
npm ci
npm run cf:deploy
```

The root command `npm run build` still builds the engineering / authority viewer and is intentionally not the public deployment target.

## URLs

- `https://quarto.cmish.dev/` is the public presentation URL.
- `workers_dev` and preview URLs remain enabled for deployment checks.

## Secrets

Never commit Cloudflare tokens or other credentials. Configure account credentials in the Cloudflare dashboard / CI secrets, not in this repository.
