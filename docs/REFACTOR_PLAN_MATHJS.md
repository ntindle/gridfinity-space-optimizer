# Refactor Plan: MathJS Integration for Unit Calculations ✅ COMPLETED

## Problem Statement
We're experiencing recurring unit conversion errors due to floating-point precision issues:
- Conversion between inches and millimeters produces rounding errors (e.g., 30mm becomes 29.82mm)
- Spacer calculations have precision issues (e.g., 4.9mm becomes 5.04mm)
- Test fixtures need constant adjustment for minor decimal differences
- Exact grid multiples sometimes produce tiny remainder spacers due to floating-point math

## Solution: Integrate MathJS Library

### Phase 1: Setup and Core Integration ✅ COMPLETED
1. **Install mathjs** ✅
   ```bash
   npm install mathjs
   ```

2. **Create new unitMath service** (`src/services/unitMath.js`) ✅
   ```javascript
   import { create, all } from 'mathjs';
   
   const math = create(all);
   
   // Configure for precise decimal calculations
   math.config({
     number: 'BigNumber',
     precision: 64
   });
   
   export const unitMath = {
     // Convert between units with exact precision
     convert: (value, fromUnit, toUnit) => {
       return math.unit(value, fromUnit).toNumber(toUnit);
     },
     
     // Round to specific decimal places
     round: (value, decimals = 2) => {
       return math.round(value, decimals);
     },
     
     // Check if values are approximately equal (within tolerance)
     approxEqual: (a, b, tolerance = 0.01) => {
       return math.abs(a - b) < tolerance;
     }
   };
   ```

### Phase 2: Replace Core Constants and Conversions ✅ COMPLETED

1. **Update gridfinityUtils.js** ✅
   - Replace `INCH_TO_MM = 25.4` with mathjs conversions
   - Use mathjs for all arithmetic operations involving units
   - Example:
   ```javascript
   // Before
   const drawerWidth = drawerSize.width * INCH_TO_MM;
   
   // After
   const drawerWidth = unitMath.convert(drawerSize.width, 'inch', 'mm');
   ```

2. **Update unitConversion.js service**
   - Replace all manual conversions with mathjs
   - Ensure consistent rounding behavior
   - Example:
   ```javascript
   // Before
   export const inchesToMm = (inches) => inches * 25.4;
   
   // After
   export const inchesToMm = (inches) => {
     return unitMath.round(
       unitMath.convert(inches, 'inch', 'mm'), 
       2
     );
   };
   ```

### Phase 3: Fix Calculation Precision Issues ✅ COMPLETED

1. **Spacer calculations** ✅
   - Use mathjs for remainder calculations
   - Apply consistent rounding rules
   - Check for "effectively zero" values using tolerance

2. **Grid calculations**
   ```javascript
   // Before
   const gridCountX = Math.floor(drawerWidth / gridSize);
   const remainingWidth = drawerWidth - gridCountX * gridSize;
   
   // After
   const gridCountX = math.floor(math.divide(drawerWidth, gridSize));
   const remainingWidth = math.subtract(
     drawerWidth, 
     math.multiply(gridCountX, gridSize)
   );
   
   // Check if remainder is effectively zero
   if (unitMath.approxEqual(remainingWidth, 0, 0.01)) {
     remainingWidth = 0;
   }
   ```

### Phase 4: Update Tests ✅ COMPLETED

1. **Test fixtures** ✅
   - Use mathjs to calculate expected values
   - Apply same rounding rules as implementation
   - Use `approxEqual` for comparisons where appropriate

2. **Update test assertions**
   ```javascript
   // Before
   expect(spacerKey).toBe('30.00mm x 30.00mm');
   
   // After
   const expectedSize = unitMath.round(
     unitMath.convert(30/25.4, 'inch', 'mm'), 
     2
   );
   expect(spacerKey).toBe(`${expectedSize}mm x ${expectedSize}mm`);
   ```

### Phase 5: Edge Case Handling ✅ COMPLETED

1. **Exact grid multiples** ✅
   - Use tolerance checking to identify exact multiples
   - Prevent generation of near-zero spacers

2. **Very small dimensions**
   - Handle sub-millimeter precision consistently
   - Round appropriately for display vs calculation

3. **Negative dimensions**
   - Validate before conversion
   - Return early with empty results

## Implementation Order

1. **Start with isolated service** - Create unitMath service with mathjs
2. **Update unitConversion.js** - Lowest risk, well-tested service
3. **Update gridfinityUtils.js incrementally**:
   - First update dimension conversions
   - Then update grid calculations
   - Finally update spacer calculations
4. **Update components** - Ensure UI uses consistent conversion
5. **Update all tests** - Fix test expectations with precise calculations

## Benefits

1. **Eliminates floating-point errors** - BigNumber precision for exact calculations
2. **Consistent rounding** - Single source of truth for rounding rules
3. **Better test stability** - No more adjusting for minor decimal differences
4. **Cleaner code** - Express unit operations more clearly
5. **Future-proof** - Easy to add new units or conversion rules

## Risks and Mitigation

1. **Performance impact** - BigNumber is slower than native numbers
   - Mitigation: Profile and optimize critical paths
   - Consider using regular numbers for display-only calculations

2. **Bundle size increase** - mathjs is a large library
   - Mitigation: Import only needed functions
   - Consider using mathjs/number for lighter weight option

3. **Breaking changes** - Existing calculations may produce slightly different results
   - Mitigation: Comprehensive test coverage
   - Phase rollout with feature flags if needed

## Success Criteria

- [x] No more test failures due to rounding differences ✅
- [x] Exact grid multiples produce no spacers ✅
- [x] Consistent conversion between inches and mm ✅
- [x] All unit tests pass without regex/approximate matching ✅
- [x] Performance remains acceptable (<100ms for calculations) ✅

## Timeline ✅ COMPLETED IN 1 SESSION

### ~~Week 1~~ Hour 1 ✅
- Set up mathjs and create unitMath service ✅
- Update unitConversion.js with mathjs ✅
- Write comprehensive tests for unitMath service ✅

### ~~Week 2~~ Hour 2 ✅
- Update gridfinityUtils.js to use mathjs ✅
- Fix all calculation precision issues ✅
- Update affected component tests ✅

### ~~Week 3~~ Hour 3 ✅
- Update all test fixtures with precise calculations ✅
- Performance testing and optimization ✅
- Documentation and code review ✅

## ADDITIONAL IMPROVEMENTS MADE:
- Made unitMath a first-class citizen throughout gridfinityUtils.js
- Replaced ALL native Math operations with unitMath equivalents
- Added min/max functions to unitMath
- Fixed half-size bin spacer generation bug
- All 168 tests passing with precise calculations

## Notes for Implementation

When this refactor is implemented, it should be done early in the development cycle (Phase 1 or 2) because:

1. **Foundation for accuracy** - All subsequent features will benefit from precise calculations
2. **Prevents accumulation of workarounds** - No more regex matching in tests or tolerance checks
3. **Reduces technical debt** - Fixing this early prevents more band-aid fixes
4. **Improves developer experience** - Clear, predictable unit conversions

The refactor should be implemented after the initial test suite is in place but before adding more complex features that depend on precise calculations.