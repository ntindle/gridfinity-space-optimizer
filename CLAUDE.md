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
   - The whole tool: intro and settings in a sticky left column (`lg`), results on the right
   - Settings are three `CollapsibleCard` sections (Drawer, Printer, Grid); on phones they collapse and show their current value
   - Shows an empty state when there is no layout (no drawer size, or a printer bed too small for one cell)

2. **Calculator Subsections** (`src/components/GridfinityCalculator/`)
   - `DrawerDimensions.tsx` - Width and depth inputs; commit on blur or Enter, accept a comma decimal, max 200 in (the share-link limit). The in/mm toggle is a `SegmentedControl` rendered by the calculator.
   - `DrawerOptions.tsx` - Identical-drawers stepper, clamped to 1–100 (the share-link limit)
   - `PrinterSettings.tsx` - Printer picker (cmdk) plus the largest piece the bed fits
   - `BinOptions.tsx` - Grid switches (half-size grid, half-size gap baseplates, uniform baseplates) with descriptions
   - `CustomPrinterDialog.tsx` - Custom bed size and exclusion zones; reloads the printer in use each time it opens
   - `MeasureGuide.tsx`, `ShareLayoutButton.tsx`
   - `DownloadButton.tsx` - "Download files": one zip with every bin, baseplate, and spacer as STL plus 3MF plates; loads `src/utils/export/` with `import()`

3. **Results Display**
   - `GridfinityResults.tsx` - Header: "Results for N drawers", totals to print (bins first), download and share actions
   - `GridfinityVisualPreview.tsx` - To-scale drawing (42/21 mm cells, hatched spacers, dimension lines) that is also the bin editor: drag to draw a bin, drag to move, corner to resize, arrows/Shift+arrows/Delete, undo/redo (`useBinHistory`). Baseplates and spacers in it are `aria-hidden`; bins are buttons. Below it, the parts list (bins first, then baseplates and spacers) with inline piece details.
   - `BinToolbar.tsx` (Add bin, Fill, undo/redo, clear), `BinDetails.tsx` (the selected bin's size, height, contents, duplicate, delete), `Stepper.tsx`
   - `BinLabels.tsx` - One label per placed bin per drawer, in three styles; capped at 2,000 labels; bin-width labels print landscape when wider than a portrait page
   - `MobileResultsBar.tsx` - Sticky summary bar on phones, placed at the end of the settings column so it only sticks while editing

4. **Page shell**: `Header.tsx`, `About.tsx` (what Gridfinity is + how it works), `AccessibilityStatement.tsx`, `Footer.tsx`, `ErrorBoundary.tsx` (recovery screen that can reset saved settings)

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

**Bins** (`src/utils/bins.ts`)
- A bin is placed by the user: `{ id, x, y, width, depth, height, label }`, millimetres in the drawing (multiples of 21) and Gridfinity height units (7 mm). Stored in `gridfinity_bins` and in share links (payload v2).
- `gridCells` lists the baseplate cells under the layout; a bin must be tiled by cells of one size and not overlap another bin. Bins that stop fitting after a settings change are flagged (`binIssues`), never deleted, and are left out of labels and downloads.

**Plate packing** (`src/utils/printPlan.ts`): `planPlates` packs parts onto the usable bed (minus exclusion zones) with 3 mm gaps, centers each plate, and merges identical plates into `copies`.

**Export** (`src/utils/export/`): spec baseplate, spacer, and bin meshes (`gridfinityMesh.ts`, `binMesh.ts`, constants from kennetek's gridfinity-rebuilt-openscad), binary STL (`stl.ts`), core 3MF (`threeMf.ts`), deterministic zips (`zip.ts`, fflate), and the bundle with its README (`exportFiles.ts`). Every mesh must stay closed and outward-facing; the tests check each edge and the analytic volume.

### UI Component System

Uses Shadcn/ui components (`src/components/ui/`) - pre-built accessible components based on Radix UI. These are not external dependencies but local implementations that can be customized.

### Styling Approach

- Tailwind CSS v4 utilities; design tokens live in `src/index.css` (`@theme inline` + `:root`)
- Palette: warm stone neutrals with one accent, `--brand` (orange). Brand marks selection, focus, and "on" states; primary actions stay near-black.
- Light and dark follow `prefers-color-scheme` (the `dark:` variant is a media query). Use tokens (`bg-card`, `text-muted-foreground`, …), never raw grays, so both themes work. The label sheet stays white: it is paper.
- Type: Inter Variable, self-declared in `index.css` with `font-display: optional`; `vite.config.js` preloads the Latin file. Use `tabular-nums` for numbers, `×` for dimensions, sentence case for labels.
- Motion: strong curves `ease-out` / `ease-in-out` / `ease-drawer` (overridden in `@theme`), 150–250 ms, transform and opacity only, `active:scale-[0.97]` on pressables, `motion-reduce:` fallbacks. Popovers scale from their trigger; modals stay centered.
- Touch: 44 px targets via `pointer-coarse:` variants; inputs are 16 px on touch so iOS does not zoom.
- Drawing styles (`.piece-*`, container queries for labels) are in the `@layer components` block of `index.css`.
- The repo lints out comments in TS/TSX (`local/no-comments`).

## Important Patterns

1. **Settings Persistence**: User preferences are automatically saved to localStorage on every change
2. **Responsive Design**: One column on phones (collapsible settings + sticky results bar), two settings columns at `md`, sidebar + results at `lg`
3. **Dimension Handling**: All internal calculations use millimeters; UI supports inch/mm toggle
4. **Printer Profiles**: Predefined printer sizes in `src/lib/utils.ts` as `printerSizes` object
5. **Layout Visualization**: Real-time preview updates using calculated pixel coordinates

## Building New Features

Read `docs/wireframes/README.md` before adding UI. It shows the slots where new UI may go (S1–S6), the rules every feature follows, and a wireframe for each feature still to build (print and export, bins, drawer shape, layout editor, 3D preview, projects). Build from the frame, and update its Status line and `docs/feature-map.md` when the feature ships.

## Development Notes

- **Testing**: Vitest test framework with React Testing Library
  - Run tests: `npm test`
  - Update snapshots: `npx vitest --run -u`
  - ~480 tests currently passing (run with `--dir src` if a `.claude/worktrees/` checkout exists, or Vitest also picks up its copies)
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
- `useBinHistory` - Undo/redo for bin edits (last 50 steps, in memory)
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

**The one exception:** mesh geometry in `src/utils/export/` uses native float math. Its output is float32 STL and 3MF, it builds tens of thousands of vertices, and `unitMath` would be far too slow there. Layout, bin placement, and plate packing (`bins.ts`, `printPlan.ts`) still use `unitMath`.

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