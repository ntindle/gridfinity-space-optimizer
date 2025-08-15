# Gridfinity Space Optimizer - GitHub Copilot Instructions

**ALWAYS follow these instructions first and only fallback to additional search and context gathering if the information in the instructions is incomplete or found to be in error.**

## Project Overview

Gridfinity Space Optimizer is a TypeScript React web application that calculates optimal Gridfinity storage system layouts. It helps users determine the best configuration of Gridfinity bins to fit their drawer dimensions and 3D printer build volumes. Built with React 18, Vite, TypeScript, Tailwind CSS, and Shadcn/ui components.

## Working Effectively

### Prerequisites
- Node.js version 22.5 or later (verified with v20.19.4+)
- npm (comes with Node.js)

### Bootstrap, Build, and Test the Repository

**CRITICAL**: Set timeouts of 60+ minutes for build commands and 30+ minutes for test commands. NEVER CANCEL long-running operations.

1. **Install dependencies**:
   ```bash
   npm install
   ```
   - Takes ~2 minutes to complete
   - May show deprecation warnings (expected)
   - May show 2-3 moderate severity vulnerabilities (known issue)

2. **Run all quality checks**:
   ```bash
   npm run lint
   ```
   - Takes ~5 seconds
   - NEVER CANCEL: Wait for completion
   - Must show 0 warnings/errors for CI to pass

   ```bash
   npx tsc --noEmit
   ```
   - Takes ~4 seconds
   - TypeScript type checking
   - NEVER CANCEL: Wait for completion

3. **Run tests**:
   ```bash
   npm test
   ```
   - Takes ~11 seconds. NEVER CANCEL. Set timeout to 30+ minutes.
   - Currently 202 tests passing, 11 skipped
   - Memory-intensive due to large calculation tests
   - May show debug output for test scenarios (expected)

4. **Build production**:
   ```bash
   npm run build
   ```
   - Takes ~14 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
   - Creates optimized build in `dist/` directory
   - Shows bundle size warnings for mathjs library (expected)

5. **Build development**:
   ```bash
   npm run build:dev
   ```
   - Takes ~14 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
   - Creates development build with source maps

### Running the Application

1. **Development server**:
   ```bash
   npm run dev
   ```
   - Starts on port 8080 (or next available port)
   - Hot module replacement enabled
   - Access via http://localhost:8080 (or displayed port)

2. **Preview production build**:
   ```bash
   npm run preview
   ```
   - Serves production build on port 4173
   - Must run `npm run build` first

## Validation

### Manual Testing Requirements
**ALWAYS run through complete end-to-end scenarios after making changes.**

**Required Test Scenario**:
1. Start development server with `npm run dev`
2. Open application in browser
3. Verify default drawer dimensions (22.5" x 16.5") are loaded
4. Toggle units from inches to mm - verify conversion (571.5mm x 419.1mm)
5. Change width dimension - verify results update automatically
6. Verify visual preview updates with new layout
7. Check that spacers are generated correctly
8. Test with "Use only half-size bins" enabled - verify spacers still work
9. Change printer selection - verify build volume updates

**Critical Areas to Always Test**:
- Unit conversion (inches ↔ mm) must be precise
- Real-time calculation updates when dimensions change
- Spacer generation with both full-size and half-size bins
- Visual preview accuracy with layout changes

### Pre-commit Validation
**ALWAYS run these before committing changes:**
```bash
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Architecture and Important Locations

### Entry Points
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Root component with routing and providers
- `src/pages/Index.tsx` - Main page layout

### Core Components
- **Main Calculator**: `src/components/GridfinityCalculator.tsx`
  - Central orchestration component
  - Manages all calculation state
- **Calculator Sections**: `src/components/GridfinityCalculator/`
  - `DrawerDimensions.tsx` - Input for drawer size with unit conversion
  - `PrinterSettings.tsx` - 3D printer selection with build volumes
  - `BinOptions.tsx` - Half-size bin toggles
  - `DrawerOptions.tsx` - Number of duplicate drawers
  - `CustomPrinterDialog.tsx` - Custom printer dimension input
- **Results Display**:
  - `src/components/GridfinityResults.tsx` - Calculated bin quantities
  - `src/components/GridfinityVisualPreview.tsx` - Visual layout grid

### Core Logic
- **Calculation Engine**: `src/utils/gridfinityUtils.ts`
  - Main function: `calculateGrids()` - Computes optimal bin layout
  - Constants: `FULL_GRID_SIZE = 42mm`, `HALF_GRID_SIZE = 21mm`
- **Precision Math**: `src/services/unitMath.ts`
  - **CRITICAL**: ALL math operations must use this service
  - Fixes floating-point precision issues with BigNumber arithmetic
- **Unit Conversion**: `src/services/unitConversion.ts`
  - Handles inch/mm conversions with validation

### State Management
- **Global Settings**: `src/contexts/SettingsContext.tsx`
  - Centralized application state using React Context
  - Automatic localStorage persistence
- **Focused Hooks**:
  - `useSettings()` - Access all settings
  - `useDrawerSettings()` - Drawer-specific settings
  - `usePrinterSettings()` - Printer-specific settings
  - `useBinOptions()` - Bin option toggles

### Styling
- **Tailwind CSS** for utility-first styling
- **Shadcn/ui components** in `src/components/ui/`
- Custom layouts using CSS Grid with `repeat(auto-fit, minmax(300px, 1fr))`

## Critical Development Rules

### ⚠️ NEVER use native JavaScript math in calculations
```javascript
// ❌ WRONG - will cause precision issues
const total = width + height;
const area = width * height;

// ✅ CORRECT - use unitMath service
import { unitMath } from '@/services/unitMath';
const total = unitMath.add(width, height);
const area = unitMath.multiply(width, height);
```

### ⚠️ Always use @/ import alias
```javascript
// ❌ WRONG - inconsistent relative imports
import { something } from '../../../lib/utils';

// ✅ CORRECT - use @ alias
import { something } from '@/lib/utils';
```

### ⚠️ TypeScript Required
- Project is 100% TypeScript
- All new files must be .ts/.tsx
- Full type safety enforced
- Use existing type definitions in `src/types/`

### ⚠️ Test Coverage Requirements
- Always add tests for algorithm changes
- Update snapshots with `npx vitest --run -u` when precision changes
- Test both full-size and half-size bin scenarios

## Common Tasks and Commands

### File Structure Overview
```
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn/ui component library
│   │   └── GridfinityCalculator/ # Calculator components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Core services (unitMath, unitConversion)
│   ├── utils/              # Utility functions (gridfinityUtils)
│   ├── lib/                # Library configurations
│   └── types/              # TypeScript type definitions
├── .github/workflows/      # CI/CD pipeline definitions
└── docs/                   # Documentation
```

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.js` - Build configuration (port 8080)
- `vite.config.test.js` - Test configuration
- `eslint.config.js` - Linting rules (max warnings: 0)
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - CSS framework configuration

### Development Workflow
1. **Start development**: `npm run dev`
2. **Make changes** with TypeScript and proper imports
3. **Test changes** with complete user scenarios
4. **Run quality checks**: `npm run lint && npx tsc --noEmit`
5. **Run tests**: `npm test`
6. **Build verification**: `npm run build`

### Debugging Common Issues
- **Build failures**: Check TypeScript errors with `npx tsc --noEmit`
- **Test failures**: Often related to precision - use unitMath service
- **Lint failures**: Must fix all warnings/errors (max-warnings: 0)
- **Memory issues**: Tests may use significant memory due to calculations

## CI/CD Pipeline

The project uses GitHub Actions across multiple workflows:
- **CI Pipeline**: Tests on Node.js 18.x, 20.x, 22.x
- **Code Quality**: ESLint and TypeScript checking
- **Security**: CodeQL, SAST tools, secret detection
- **Deployment**: Automatic deployment to GitHub Pages

All pull requests must pass:
- TypeScript type checking (`npx tsc --noEmit`)
- ESLint with zero warnings (`npm run lint`)
- All tests passing (`npm test`)
- Successful production build (`npm run build`)

## Known Issues and Gotchas

1. **Memory Usage**: Tests may consume significant memory due to large calculation matrices
2. **Precision Requirements**: Always use `unitMath` service for calculations to avoid floating-point errors
3. **Snapshot Tests**: Will fail when precision changes - update with `npx vitest --run -u`
4. **Half-size Bin Testing**: Critical bug was fixed - always test spacer generation with half-size bins enabled
5. **Build Warnings**: mathjs library causes bundle size warnings (expected and acceptable)

## Performance Considerations

- **Build Time**: ~14 seconds (normal)
- **Test Time**: ~11 seconds (can spike with memory-intensive tests)
- **Development Server**: Starts in ~200ms with HMR
- **Bundle Size**: math-vendor chunk is large (~633KB) due to mathjs precision library

Remember: This application prioritizes calculation accuracy over bundle size due to the precision requirements of Gridfinity layout calculations.