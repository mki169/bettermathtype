# BetterMathType

A MathType-inspired equation editor that renders crisp, Times New Roman-compatible equations as SVG for Microsoft Word.

Everything runs in the browser: no backend, no API keys, no analytics. Documents, recent equations, and theme preference are stored in `localStorage`.

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmki169%2Fbettermathtype)

The Vercel button clones this repository into your own Git account, so you need access to it while signed in to GitHub and Vercel. If the button cannot access this private repository, use the manual import steps below.

Cloudflare does not offer a one-click Deploy button for Pages (its Deploy button supports Workers only, and requires a public repository). Use [Workers & Pages → Create application](https://dash.cloudflare.com/?to=/:account/workers-and-pages) and the Pages steps below.

## Features

- Visual equation editing with [MathLive](https://mathlive.io/) and LaTeX input.
- SVG output via MathJax with the STIX 2 font, flattened to paths for Word.
- Copy for Word at an exact point size, plus SVG/PNG export and LaTeX copy.
- Live Word-style preview with inline and display modes.
- Light/dark theme with system-preference default and persistent override.
- Local autosave, recent equations, undo/redo, symbol search, and a template ribbon.

## Tech stack

- [Vite](https://vite.dev/) for development and bundling
- [MathLive](https://mathlive.io/) for input
- [MathJax](https://www.mathjax.org/) with STIX 2 for SVG output
- Vanilla JavaScript and CSS, no UI framework

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by Vite 8)
- npm

## Local development

```sh
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` by default.

## Build and preview

```sh
npm run build
npm run preview
```

The production build is written to `dist/`. Preview serves it locally at `http://localhost:4173` by default.

## Project structure

```text
index.html            Application shell and initial theme setup
src/main.js           Editor, rendering, export, persistence, and theme logic
src/toolbar.js        Ribbon tabs, symbol groups, and examples
src/styles.css        Application styles and dark theme overrides
public/vendor/        Prebuilt MathJax STIX 2 bundle (self-hosted)
public/mathlive-fonts Self-hosted MathLive fonts
public/favicon.svg    Favicon
```

## Deployment

The app is a static single-page site. Both platforms below build with:

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

The site must be served from a domain root, not a subpath. Asset URLs (`/assets`, `/vendor`, `/mathlive-fonts`) are absolute, so `https://example.com/` works while `https://example.com/app/` does not without changing Vite's `base`.

### Vercel

Vercel detects Vite automatically and sets the build command and output directory. No `vercel.json` is required because the app has no client-side routes.

1. Push the repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository. Grant Vercel access to the private repository if prompted.
3. Confirm **Framework Preset: Vite**, **Build Command: `npm run build`**, and **Output Directory: `dist`**.
4. Select **Deploy**.

Or deploy from the command line:

```sh
npx vercel
npx vercel --prod
```

Notes:

- The free Hobby plan allows personal, non-commercial use, 100 GB of fast data transfer per month, and 100 deployments per day.
- A Vercel Hobby project is not permitted for commercial use.

Official docs: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) and [Hobby plan limits](https://vercel.com/docs/plans/hobby).

### Cloudflare Pages

Cloudflare Pages supports private GitHub repositories and provides free unlimited bandwidth.

1. In the Cloudflare dashboard, go to **Workers & Pages → Create application → Pages → Connect to Git**.
2. Authorize GitHub and select the repository.
3. Set **Production branch** to `main`.
4. Use **Framework preset: Vite** if listed, otherwise **None**.
5. Set **Build command** to `npm run build` and **Build output directory** to `dist`.
6. Select **Save and Deploy**.

No environment variables are needed. The current Pages build image defaults to Node.js 22, which satisfies Vite 8. If you pin an older image, set `NODE_VERSION=22` in the project's environment variables.

Direct upload without Git integration:

```sh
npm run build
npx wrangler pages deploy dist --project-name bettermathtype
```

Direct Upload projects cannot be switched to Git integration later, so prefer the Git integration for continuous deployment.

Free-plan limits relevant to this project: 500 builds per month, 20,000 files, and 25 MiB per file. The largest asset (the MathJax bundle) is about 2.1 MB, so it fits comfortably.

Official docs: [Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/), [Build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), and [Limits](https://developers.cloudflare.com/pages/platform/limits/).

## Data and privacy

All state stays in the browser. The app uses these `localStorage` keys:

- `bettermathtype:document` — current equation and editor preferences
- `bettermathtype:recent` — recent copied equations
- `bettermathtype:theme` — explicit light or dark theme choice

Use **Preferences → Clear local data** to remove the document and recent history.

## License

ISC
