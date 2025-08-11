# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gridfinity Space Optimizer is a React-based web application for calculating optimal Gridfinity storage system layouts. It helps users determine the best configuration of Gridfinity bins to fit their drawer dimensions and 3D printer build volumes.

## Recent Major Changes (Updated: August 2025)

### ✅ MathJS Integration for Precision
- **CRITICAL**: All calculations now use `unitMath` service (`src/services/unitMath.ts`) for BigNumber precision
- Never use native JavaScript math operations (`+`, `-`, `*`, `/`, `Math.*`) in calculation code
- Always use `unitMath.add()`, `unitMath.subtract()`, `unitMath.multiply()`, `unitMath.divide()`, etc.
- This fixes all floating-point precision issues (no more `41.099999999999966`, now exactly `41.1`)

### ✅ Fixed Half-Size Bin Spacer Bug
- Spacers are now correctly generated when "Use only half-size bins" is enabled
- The fix ensures remaining space after half-size bins is filled with spacers

### ✅ Completed Refactoring
- Phase 1 of refactor plan completed (clean up & stabilize)
- Phase 2 of refactor plan completed (state management)
- Phase 3 of refactor plan completed (feature enhancements)
- Phase 4 COMPLETED: TypeScript migration
  - ✅ All source code migrated to TypeScript (100% completion)
  - ✅ Core utilities: `unitMath.ts`, `unitConversion.ts`, `gridfinityUtils.ts`
  - ✅ All React components and hooks migrated to TypeScript
  - ✅ All test files migrated to TypeScript
  - ✅ Type definitions created for all core data structures
  - ✅ ESLint configured for TypeScript support
  - ✅ All 187 tests passing
- All console.log statements removed from production code
- Import paths standardized to use `@/` alias consistently
- ESLint configuration supports both TypeScript and JavaScript
- Settings Context implemented with global state management
- Custom printer dimensions UI fully functional

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 8080)
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Core Technologies
- **TypeScript** - Type-safe JavaScript with full type coverage
- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **React Router** - Single-page routing
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Component library built on Radix UI primitives
- **React Query** - Server state management (installed but not actively used)
- **MathJS** - Arbitrary precision arithmetic

### Application Structure

The app follows a standard React SPA pattern with component-based architecture:

- **Entry Point**: `src/main.tsx` → `src/App.tsx` → `src/pages/Index.tsx`
- **Main Calculator**: `src/components/GridfinityCalculator.tsx` orchestrates the entire calculation workflow
- **State Management**: 
  - Global state via `SettingsContext` and `SettingsProvider`
  - Local React state with localStorage persistence via `usePersistedState` hook
  - Legacy compatibility maintained with `saveUserSettings`/`loadUserSettings` utilities
- **Routing**: Single route application with potential for expansion

### Key Components

1. **GridfinityCalculator** (`src/components/GridfinityCalculator.tsx`)
   - Central component managing drawer dimensions, printer settings, and bin options
   - Coordinates child components and manages calculation state
   - Persists user preferences to localStorage

2. **Calculator Subsections** (`src/components/GridfinityCalculator/`)
   - `DrawerDimensions.tsx` - Input for drawer size (inches/mm conversion)
   - `PrinterSettings.tsx` - 3D printer selection with predefined build volumes
   - `BinOptions.tsx` - Toggle for half-size bin preferences
   - `DrawerOptions.tsx` - Number of identical drawers
   - `CustomPrinterDialog.tsx` - Dialog for entering custom printer dimensions

3. **Results Display**
   - `GridfinityResults.tsx` - Shows calculated bin quantities
   - `GridfinityVisualPreview.tsx` - Visual layout representation

### Core Logic

**Gridfinity Calculation Engine** (`src/utils/gridfinityUtils.ts`)
- Constants: `FULL_GRID_SIZE = 42mm`, `HALF_GRID_SIZE = 21mm`
- Main function: `calculateGrids()` - Computes optimal bin layout
- **CRITICAL**: ALL math operations must use `unitMath` from `@/services/unitMath`
  - Example: Instead of `width + height`, use `unitMath.add(width, height)`
  - Example: Instead of `width * GRID_SIZE`, use `unitMath.multiply(width, GRID_SIZE)`
  - Example: Instead of `Math.min(a, b)`, use `unitMath.min(a, b)`
  - Example: Instead of `value.toFixed(2)`, use `unitMath.round(value, 2)`
- Key algorithms:
  - Bin placement respecting printer build volume constraints
  - Spacer generation for non-standard dimensions (now works with half-size bins too!)
  - Half-size bin optimization when enabled
  - Layout splitting for items exceeding print bed size

### UI Component System

Uses Shadcn/ui components (`src/components/ui/`) - pre-built accessible components based on Radix UI. These are not external dependencies but local implementations that can be customized.

### Styling Approach

- Tailwind CSS for utility classes
- Custom responsive grid layouts using inline styles for precise control
- Component-specific CSS modules where needed

## Important Patterns

1. **Settings Persistence**: User preferences are automatically saved to localStorage on every change
2. **Responsive Design**: Grid layouts use `repeat(auto-fit, minmax(300px, 1fr))` for adaptive columns
3. **Dimension Handling**: All internal calculations use millimeters; UI supports inch/mm toggle
4. **Printer Profiles**: Predefined printer sizes in `src/lib/utils.ts` as `printerSizes` object
5. **Layout Visualization**: Real-time preview updates using calculated pixel coordinates

## Development Notes

- **Testing**: Vitest test framework with React Testing Library
  - Run tests: `npm test`
  - Update snapshots: `npx vitest --run -u`
  - 187 tests currently passing
- ESLint configured for TypeScript/TSX and JavaScript/JSX with max warnings set to 0
- Development server runs on port 8080 (configured in vite.config.js)
- Uses Vite's hot module replacement for rapid development

## Custom Hooks Available

- `useSettings` - Access settings from context (use this in components)
- `useDrawerSettings` - Focused access to drawer-related settings
- `usePrinterSettings` - Focused access to printer-related settings
- `useBinOptions` - Focused access to bin option settings
- `useDrawerCount` - Focused access to drawer count setting
- `useGridfinitySettings` - Main settings state management (used internally by context)
- `useGridfinityCalculation` - Performs calculations with memoization
- `usePersistedState` - Generic hook for localStorage persistence
- `useLegacyMigration` - Handles migration from old localStorage format
- `useCustomPrinter` - Manages custom printer dimensions
- `use-toast` - Toast notification system

## Current Refactor Status

See `REFACTOR_PLAN.md` for details:
- ✅ Phase 1: Clean Up & Stabilize - COMPLETED
- ✅ Phase 2: State Management - COMPLETED
- ✅ Phase 3: Feature Enhancements - COMPLETED
- ✅ Phase 4: Architecture with TypeScript - COMPLETED
- ❌ Phase 5-6: Not started yet

See `docs/REFACTOR_PLAN_MATHJS.md` for MathJS integration:
- ✅ All phases COMPLETED - precision issues fixed!

See `TYPESCRIPT_MIGRATION.md` for TypeScript migration details:
- ✅ Setup and configuration completed
- ✅ Core utilities migrated
- ✅ All hooks migrated to TypeScript
- ✅ All components migrated to TypeScript  
- ✅ All test files migrated to TypeScript
- ✅ 100% TypeScript migration COMPLETED - no JS/JSX files remaining in src/

## Critical Warnings & Gotchas

### ⚠️ NEVER use native JavaScript math in calculations
```javascript
// ❌ WRONG - will cause precision issues
const total = width + height;
const area = width * height;
const half = value / 2;

// ✅ CORRECT - use unitMath for precision
const total = unitMath.add(width, height);
const area = unitMath.multiply(width, height);
const half = unitMath.divide(value, 2);
```

### ⚠️ Always test with half-size bins enabled
- There was a long-standing bug where spacers weren't generated with half-size bins
- This is now fixed, but always verify spacers are generated correctly
- Test case: 22.5" x 16.5" drawer with half-size bins should show spacers

### ⚠️ Import paths must use @/ alias
```javascript
// ❌ WRONG - inconsistent relative imports
import { something } from '../../../lib/utils';

// ✅ CORRECT - use @ alias
import { something } from '@/lib/utils';
```

### ✅ Project is now fully TypeScript
- All source code migrated from JavaScript to TypeScript
- ESLint configured for both .ts/.tsx and .js/.jsx files
- Full type safety with TypeScript types and interfaces
- Zero JavaScript files remaining in src/ directory

## Known Issues to Watch For

1. **Memory issues during tests**: Tests sometimes run out of memory due to large calculations
2. **Snapshot tests**: Will fail when precision calculations change - update with `npx vitest --run -u`
3. **localStorage migration**: Legacy settings are migrated on first load - don't break this!
- Always add tests for new features or changes to the algorithms

## GitHub Templates

- **Pull Request Template**: `.github/pull_request_template.md` - Standardized PR checklist
- **Bug Report Template**: `.github/ISSUE_TEMPLATE/bug_report.md` - Structured bug reporting format