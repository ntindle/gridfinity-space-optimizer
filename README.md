# Gridfinity Calculator

[![CI](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/ci.yml)
[![Code Quality](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/code-quality.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/code-quality.yml)
[![CodeQL](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/codeql.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/codeql.yml)
[![SAST](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/sast.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/sast.yml)
[![codecov](https://codecov.io/gh/ntindle/gridfinity-space-optimizer/branch/main/graph/badge.svg)](https://codecov.io/gh/ntindle/gridfinity-space-optimizer)

This project is a web-based calculator for designing custom Gridfinity layouts, built with React, Vite, and Tailwind CSS.

## Features

- Drawer size to a fitted layout: baseplates on the 42 mm grid, plus spacers for the leftover edge
- Baseplates split to fit your printer's bed, including custom printers with exclusion zones
- A half-size (21 mm) grid, for the whole drawer or just to fill the gaps at the walls
- Lay out your bins on a to-scale drawing of the drawer: draw, move, and resize them, set each one's height and contents, with keyboard controls and undo
- Download everything in one zip: every bin, baseplate, and spacer as STL, plus 3MF plates laid out for your printer, with a README of what to print and how many
- Gridfinity-spec geometry: open-frame baseplates, bins with the standard base and stacking lip
- Print a label for every bin in three styles
- Shareable layout links that include your bins; settings are saved in the browser
- Works on phones, follows the system light or dark mode, keyboard and screen-reader friendly

## Getting Started

### Prerequisites

- Node.js (version 22.5 or later recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ntindle/gridfinity-space-optimizer.git
   ```

2. Navigate to the project directory:

   ```bash
   cd gridfinity-space-optimizer
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

### Development

To run the development server:

```bash
npm run dev
```

or

```bash
yarn dev
```

The application will be available at `http://localhost:8080` by default.

### Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm test -- --coverage
```

### Linting

Check code quality:

```bash
npm run lint
```

### Building for production

To create a production build:

```bash
npm run build
```

or

```bash
yarn build
```

## Analytics

Product analytics use [PostHog](https://posthog.com). They are off unless a project token is set at build time, and they need no cookie banner:

- PostHog runs in cookieless mode with in-memory persistence. It sets no cookies and stores nothing in the browser. Its only write is a feature-test key that it deletes at once, and the flags it looks up (`ph_debug` and its opt-out key) are never set by this site. PostHog counts visitors with a server-side hash that rotates daily, so a person who comes back on another day counts as a new visitor.
- PostHog is never loaded when Do Not Track or Global Privacy Control is on, or in automated browsers (`navigator.webdriver`), so the production smoke check sends nothing.
- Only the events below are sent: no autocapture, session replay, heatmaps, surveys, feature flags, or external scripts. Bin contents, layout names, and the share-link payload are never sent, and `share=` is stripped from every URL.
- PostHog (about 51 KB gzipped) loads in its own chunk after the page starts. With analytics off it is never downloaded.

### Turning analytics on

1. In PostHog, go to **Settings → Project → Web analytics**, turn on **Enable cookieless tracking**, and save. Without it, PostHog drops every event this site sends.
2. In Netlify, go to **Project configuration → Environment variables** and add these with only the **Production** deploy context, so deploy previews don't count. The **Builds** scope is enough; on plans that can't limit scopes, **All scopes** works too:

   | Variable | Value |
   | --- | --- |
   | `POSTHOG_KEY` | The project token from PostHog → Settings → Project (starts with `phc_`) |
   | `POSTHOG_HOST` | `https://us.i.posthog.com` (US Cloud) or `https://eu.i.posthog.com` (EU Cloud). Optional; defaults to US Cloud |

   Don't tick **Contains secret values**. The token is public by design and ends up in `index.html`, so Netlify's secret scanning would fail the build.
3. Trigger a production deploy, because the variables are read at build time. Then open the site with Do Not Track off and look for a `$pageview` in PostHog → Activity.

The variables are deliberately not `VITE_`-prefixed. The build writes them into `index.html` as `<meta>` tags and never into the JavaScript, so the bundle is byte-identical with analytics on or off and `prod-smoke.yml` still finds its own build in production. The build fails if `POSTHOG_KEY` is not a `phc_` project token, so a personal API key can't be published by mistake. To try analytics locally, copy `.env.example` to `.env.local` and fill it in.

### Events

| Event | Sent when | Properties |
| --- | --- | --- |
| `$pageview`, `$pageleave` | The page opens or closes | PostHog's standard browser, screen, and referrer properties |
| `layout_created` | The first change to the layout in a visit | `change`: `drawer_size`, `printer`, `grid`, `drawer_count`, `bin_options`, or `bins` |
| `layout_edited` | Each later change, at most once per 2 seconds for each kind of change | `change` |
| `bins_added` | Bins are drawn, added, filled, or duplicated | `count` (bins added), `total` |
| `preview_3d_opened` | The 3D preview opens | none |
| `layout_saved` | A layout is saved on the device | layout summary |
| `layout_loaded` | A saved layout or a share link is opened | layout summary, `source` (`saved` or `share_link`) |
| `layout_shared` | A share link is created | layout summary |
| `files_downloaded` | The print files download | layout summary, `baseplates`, `spacers`, `parts`, `prints`, `skipped_bins`, `test_fit`, `label_tabs`, `dividers`, `lids`, `magnets`, `screws`, `scoop` |
| `labels_printed` | Bin labels are sent to the printer | `labels`, `style` |

The layout summary is `drawer_width_mm`, `drawer_depth_mm`, `units`, `printer`, `drawers`, and `bins` (a count). The events are defined in `src/services/analytics.ts`.

## Production smoke and rollback

After every push to `main`, `.github/workflows/prod-smoke.yml` waits until https://gridfinitylayout.com/ serves the new build, then drives the core tasks in headless Chromium. If the smoke check fails it:

1. Restores the previous ready Netlify production deploy (`POST /api/v1/sites/{site_id}/deploys/{deploy_id}/restore`).
2. Opens a revert PR for the offending commit.
3. Opens or comments on a "Production smoke check failing" issue.

### Required Actions credentials

| Name | Kind | Purpose |
| --- | --- | --- |
| `NETLIFY_AUTH_TOKEN` | Secret | Personal access token with deploy rights for the site. Create at https://app.netlify.com/user/applications#personal-access-tokens |
| `NETLIFY_SITE_ID` | Variable (preferred) or Secret | Site UUID. In Netlify: Site configuration → General → Site details → Site ID. This repo uses variable `NETLIFY_SITE_ID`. |

Dry-run without restoring: Actions → Production smoke check → Run workflow → set `dry_run` to true. The log prints the current and target deploy ids, the commit of each, and `authenticatedAs`.

## CI/CD

This project uses GitHub Actions for continuous integration and deployment:

- **CI Pipeline**: Runs on every push and pull request
  - Tests across Node.js versions 18.x, 20.x, and 22.x
  - ESLint and TypeScript type checking
  - Build verification
  - Bundle size analysis

- **PR Checks**: Automated quality gates for pull requests
  - Test coverage reports
  - Code quality metrics
  - Automated PR comments with status

- **Deployment**: Netlify auto-deploys the `main` branch to https://gridfinitylayout.com/ (build: `npm run build` → `dist/`). There is no GitHub Pages deploy and no `deploy.yml` workflow — the old Deploy badge and GitHub Pages claim were removed.

- **Security**: 
  - CodeQL semantic analysis for JavaScript/TypeScript
  - Multiple SAST tools (Semgrep, Snyk, Trivy)
  - Secret detection (Gitleaks, TruffleHog)
  - Weekly dependency audits
  - Automated Dependabot updates
  
- **Accessibility**: Automated WCAG 2.0/2.1 compliance testing
  
- **Performance**: Lighthouse CI and bundle size monitoring

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

All pull requests must pass:
- TypeScript type checking
- ESLint with no errors
- All tests passing
- Successful build

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Gridfinity](https://gridfinity.xyz/) for the original modular storage system concept
- [Vite](https://vitejs.dev/) for the fast build tool and development server
- [React](https://reactjs.org/) for the UI library
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful and customizable UI components
