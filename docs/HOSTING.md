# Hosting

Quarto contains two Babylon.js applications with different purposes:

- the repository root is the MT1-S5HR3R1 engineering / authority viewer;
- `explore/body-shell-03/` is the reconciled Quarto presentation viewer intended for the public web edition.

The public Worker serves the presentation viewer, not the root authority build.

## Cloudflare Workers Builds

GitHub-connected Cloudflare Workers Builds for the public `quarto` Worker can keep the existing settings:

1. Build command: `npm run build`
2. Deploy command: `npx wrangler deploy`

The root `build` script now builds both applications: first the engineering / authority viewer, then the presentation package. The presentation step installs its own locked dependencies with `npm ci` and produces `explore/body-shell-03/dist/`. `wrangler.jsonc` serves that presentation directory with `html_handling: "drop-trailing-slash"`.

For focused local work:

```bash
npm run build:authority
npm run build:public
```

For an explicit local public deployment:

```bash
npm ci
npm run cf:deploy
```

## URLs

- `https://quarto.cmish.dev/` is the public presentation URL.
- `workers_dev` and preview URLs remain enabled for deployment checks.

## Secrets

Never commit Cloudflare tokens or other credentials. Configure account credentials in the Cloudflare dashboard / CI secrets, not in this repository.
