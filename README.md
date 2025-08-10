# Gridfinity Calculator

[![CI](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/ci.yml)
[![Code Quality](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/code-quality.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/code-quality.yml)
[![Deploy](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/deploy.yml/badge.svg)](https://github.com/ntindle/gridfinity-space-optimizer/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/ntindle/gridfinity-space-optimizer/branch/main/graph/badge.svg)](https://codecov.io/gh/ntindle/gridfinity-space-optimizer)

This project is a web-based calculator for designing custom Gridfinity layouts, built with React, Vite, and Tailwind CSS.

## Features

- Easy-to-use calculator interface
- Customizable grid dimensions
- Real-time visual preview
- Export designs for 3D printing
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

- **Deployment**: Automatic deployment to GitHub Pages on main branch

- **Security**: Weekly dependency audits and vulnerability scanning

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
