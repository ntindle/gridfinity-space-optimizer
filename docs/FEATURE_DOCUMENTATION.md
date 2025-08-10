# Gridfinity Space Optimizer - Feature Documentation

## Overview
The Gridfinity Space Optimizer is a React-based web application that calculates optimal Gridfinity storage system layouts for drawers. It determines the best configuration of standardized bins that fit within user-specified drawer dimensions while respecting 3D printer build volume constraints.

## Current Feature Set

### 1. Drawer Dimension Input
**Component**: `DrawerDimensions.jsx`
- **Unit Toggle**: Switch between inches and millimeters
- **Width Input**: Accepts drawer width with decimal precision
- **Height Input**: Accepts drawer height with decimal precision
- **Default Values**: 22.5" × 16.5" (571.5mm × 419.1mm)
- **Real-time Conversion**: Automatic conversion between units
- **Validation**: Minimum value of 0, accepts any decimal step

### 2. 3D Printer Selection
**Component**: `PrinterSettings.jsx`
- **Predefined Printers**: 
  - Bambu Lab A1 (256×256×256mm)
  - Bambu Lab A1 mini (180×180×180mm)
  - Bambu Lab P1P (256×256×256mm)
  - Bambu Lab P1S (256×256×256mm)
  - Bambu Lab X1 Carbon (256×256×256mm)
  - Bambu Lab X1E (256×256×256mm)
  - Prusa Mini (180×180×180mm)
  - Prusa MK3S+ (250×210×210mm)
  - Prusa MK4 (250×210×220mm)
  - Prusa XL (360×360×360mm)
  - Ender 3 (220×220×250mm)
  - Custom option (200×200×200mm default)
- **Combobox Interface**: Searchable dropdown with keyboard navigation
- **Sorted Display**: Alphabetically sorted printer names
- **Build Volume**: Each printer has defined X, Y, Z dimensions

### 3. Bin Configuration Options
**Component**: `BinOptions.jsx`
- **Use Only Half-Size Bins**: Forces all bins to be 21×21mm
- **Prefer Half-Size for Spacers**: Fills spacer areas with half-size bins when possible
- **Mutual Exclusivity**: Options are mutually exclusive via toggle logic
- **Switch Controls**: Accessible toggle switches with labels

### 4. Drawer Duplication
**Component**: `DrawerOptions.jsx`
- **Quantity Input**: Number field for duplicate drawers (minimum 1)
- **Auto-validation**: Prevents invalid inputs (NaN, negative, zero)
- **Blur Handling**: Resets to 1 if empty on blur
- **Multiplier Effect**: Multiplies all calculated quantities

### 5. Gridfinity Calculation Engine
**Module**: `gridfinityUtils.js`

#### Core Constants
- `FULL_GRID_SIZE`: 42mm (standard Gridfinity unit)
- `HALF_GRID_SIZE`: 21mm (half unit)
- `INCH_TO_MM`: 25.4 (conversion factor)

#### Main Algorithm (`calculateGrids`)
1. **Input Processing**:
   - Converts drawer dimensions from inches to millimeters
   - Calculates available grid positions

2. **Baseplate Generation**:
   - Determines optimal baseplate sizes (1×1 to 7×7 units)
   - Respects printer build volume constraints
   - Fills drawer space with largest possible baseplates first

3. **Spacer Calculation**:
   - Calculates remaining space after baseplate placement
   - Generates custom-sized spacers for gaps
   - Splits spacers that exceed printer dimensions

4. **Half-Size Bin Optimization**:
   - When enabled, replaces spacers with half-size bins
   - Combines adjacent half-size bins for efficiency
   - Maintains printer build volume constraints

5. **Layout Generation**:
   - Creates visual layout with pixel coordinates
   - Assigns unique colors to different baseplates
   - Maintains spatial relationships

#### Helper Functions
- `splitSpacerIfNeeded`: Divides large spacers into printable pieces
- `fillSpacerWithHalfSizeBins`: Converts spacers to half-size bins
- `combineHalfSizeBins`: Merges adjacent half-size bins
- `getColor`: Generates consistent colors for visualization

### 6. Results Display
**Component**: `GridfinityResults.jsx`
- **Categorized Output**:
  - Baseplates: Listed by size with quantities
  - Spacers: Custom dimensions in millimeters
  - Half-Size Bins: Grouped quantities
- **Drawer Multiplication**: Shows total for all drawers
- **Conditional Display**: Adapts based on selected options
- **Clear Labeling**: Descriptive text for each item type

### 7. Visual Preview
**Component**: `GridfinityVisualPreview.jsx`
- **Scale Calculation**: Fits drawer to 400px max dimension
- **Color Coding**:
  - Baseplates: Unique HSL colors per size
  - Spacers: Semi-transparent red
  - Half-size bins: Semi-transparent green
- **Grid Overlay**: Shows Gridfinity grid lines
- **Border Visualization**: Distinct borders for each element
- **Responsive Sizing**: Maintains aspect ratio

### 8. User Preferences
**Storage**: localStorage
- **Persisted Settings**:
  - Drawer dimensions (width, height)
  - Selected printer
  - Bin options (useHalfSize, preferHalfSize)
  - Number of drawers
  - Unit preference (inches/mm)
- **Auto-save**: Settings saved on every change
- **Auto-load**: Settings restored on app mount

### 9. UI/UX Features
- **Responsive Grid Layout**: Auto-fitting cards (min 300px)
- **Card-based Design**: Clean separation of feature sections
- **Consistent Styling**: Tailwind CSS utilities
- **Accessibility**: Proper labels, ARIA attributes
- **Real-time Updates**: Instant recalculation on input changes

## Data Flow

1. **User Input** → Component State
2. **State Changes** → Effect Hooks
3. **Effect Hooks** → Calculation Engine
4. **Calculation Results** → Display Components
5. **Display Updates** → Visual Feedback
6. **State Changes** → localStorage Persistence

## Technical Architecture

### Component Hierarchy
```
App
└── Index
    └── GridfinityCalculator (orchestrator)
        ├── DrawerDimensions
        ├── PrinterSettings
        ├── BinOptions
        ├── DrawerOptions
        ├── GridfinityResults
        └── GridfinityVisualPreview
```

### State Management
- **Local State**: React useState hooks
- **Side Effects**: React useEffect hooks
- **No Global State**: All state managed at GridfinityCalculator level
- **Props Drilling**: Direct prop passing to child components

### Testing Coverage
- **Component Tests**: 10 tests for GridfinityCalculator
- **Utility Tests**: 14 tests for gridfinityUtils
- **Mock Support**: localStorage, ResizeObserver, scrollIntoView
- **Test Framework**: Vitest + React Testing Library

## Browser Compatibility
- Modern browsers with ES6+ support
- CSS Grid and Flexbox required
- localStorage API required
- No IE11 support

## Performance Characteristics
- **Instant Calculations**: < 10ms for typical inputs
- **Efficient Re-renders**: React's reconciliation
- **Minimal Bundle Size**: ~200KB gzipped
- **No Backend Dependencies**: Fully client-side

## Known Limitations
1. Custom printer dimensions not user-editable via UI
2. No export functionality for results
3. No saving/loading of multiple configurations
4. No metric for print time estimates
5. No cost calculations
6. Single drawer shape (rectangular) only
7. No rotation of baseplates
8. No manual layout editing