# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gridfinity Space Optimizer is a React-based web application for calculating optimal Gridfinity storage system layouts. It helps users determine the best configuration of Gridfinity bins to fit their drawer dimensions and 3D printer build volumes.

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
- **Vite** - Build tool and dev server
- **React 18** - UI framework
- **React Router** - Single-page routing
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Component library built on Radix UI primitives
- **React Query** - Server state management

### Application Structure

The app follows a standard React SPA pattern with component-based architecture:

- **Entry Point**: `src/main.jsx` → `src/App.jsx` → `src/pages/Index.jsx`
- **Main Calculator**: `src/components/GridfinityCalculator.jsx` orchestrates the entire calculation workflow
- **State Management**: Local React state with localStorage persistence via `saveUserSettings`/`loadUserSettings` utilities
- **Routing**: Single route application with potential for expansion

### Key Components

1. **GridfinityCalculator** (`src/components/GridfinityCalculator.jsx`)
   - Central component managing drawer dimensions, printer settings, and bin options
   - Coordinates child components and manages calculation state
   - Persists user preferences to localStorage

2. **Calculator Subsections** (`src/components/GridfinityCalculator/`)
   - `DrawerDimensions.jsx` - Input for drawer size (inches/mm conversion)
   - `PrinterSettings.jsx` - 3D printer selection with predefined build volumes
   - `BinOptions.jsx` - Toggle for half-size bin preferences
   - `DrawerOptions.jsx` - Number of identical drawers

3. **Results Display**
   - `GridfinityResults.jsx` - Shows calculated bin quantities
   - `GridfinityVisualPreview.jsx` - Visual layout representation

### Core Logic

**Gridfinity Calculation Engine** (`src/utils/gridfinityUtils.js`)
- Constants: `FULL_GRID_SIZE = 42mm`, `HALF_GRID_SIZE = 21mm`
- Main function: `calculateGrids()` - Computes optimal bin layout
- Key algorithms:
  - Bin placement respecting printer build volume constraints
  - Spacer generation for non-standard dimensions
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
4. **Printer Profiles**: Predefined printer sizes in `src/lib/utils.js` as `printerSizes` object
5. **Layout Visualization**: Real-time preview updates using calculated pixel coordinates

## Development Notes

- No test framework currently configured
- ESLint configured for React/JSX with max warnings set to 0
- Development server runs on port 8080 (configured in vite.config.js)
- Uses Vite's hot module replacement for rapid development