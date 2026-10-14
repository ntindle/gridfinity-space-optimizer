# Gridfinity Calculator

[![CI](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/ci.yml)
[![Code Quality](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/code-quality.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/code-quality.yml)
[![CodeQL](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/codeql.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/codeql.yml)
[![SAST](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/sast.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/sast.yml)
[![codecov](https://codecov.io/gh/ntindle/gridfinity-space-optimizer/branch/main/graph/badge.svg)](https://codecov.io/gh/ntindle/gridfinity-space-optimizer)

This project is a web-based calculator for designing custom Gridfinity layouts, built with React, Vite, and Tailwind CSS.

## Features

- Easy-to-use calculator interface
- Customizable grid dimensions
- Real-time visual preview
- Shareable layout links (export for printing is not built yet; see docs/backlog.md)
- Support for various 3D printer sizes

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

### Claude Code Review

`.github/workflows/claude-code-review.yml` needs the `CLAUDE_CODE_OAUTH_TOKEN` secret. If it is missing the job skips with a warning. If it is present but expired (Anthropic returns 401), the job warns and still passes so merges are not blocked. Refresh it by running `claude setup-token` locally and replacing the repo secret.

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
