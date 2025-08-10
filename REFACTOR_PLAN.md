# Gridfinity Space Optimizer - Refactor Plan

## Current Issues & Opportunities

### 1. State Management Issues
- **Problem**: GridfinityCalculator manages too much state (11 pieces)
- **Impact**: Difficult to test, maintain, and extend
- **Opportunity**: Implement proper state management pattern

### 2. Settings Persistence Coupling
- **Problem**: localStorage operations mixed with component logic
- **Impact**: Testing requires mocking, no abstraction layer
- **Opportunity**: Extract persistence layer

### 3. Missing Custom Dimensions
- **Problem**: No UI for custom printer dimensions
- **Impact**: Limited user flexibility
- **Opportunity**: Add custom dimension input

### 4. Unit Conversion Logic
- **Problem**: Unit conversion scattered across components
- **Impact**: Potential inconsistencies, duplicate code
- **Opportunity**: Centralize conversion logic

### 5. Component Responsibilities
- **Problem**: GridfinityCalculator doing orchestration + business logic
- **Impact**: Violates single responsibility principle
- **Opportunity**: Separate concerns

### 6. Test Cleanup
- **Problem**: Console.log statements in production code
- **Impact**: Unnecessary output, potential performance impact
- **Opportunity**: Remove debug code

## Refactor Plan

### Phase 1: Clean Up & Stabilize (Priority: HIGH) ✅ COMPLETED
**Timeline**: 1-2 hours
**Risk**: Low
**Impact**: High

#### Tasks:
1. **Remove Debug Code** ✅
   - Remove all console.log statements from GridfinityCalculator ✅
   - Remove window resize listeners not used in production ✅
   - Clean up GridfinityCalculator component ✅

2. **Fix Import Issues** ✅
   - GridfinityCalculator imports from both @/lib/utils and ../lib/utils ✅
   - Standardize import paths across codebase ✅
   - Update test mocks accordingly ✅

3. **Complete Card Migration** ✅
   - GridfinityCalculator.jsx already using Card components ✅
   - Remove inline "bg-white p-4 rounded-lg shadow" styles ✅
   - Ensure consistent Card usage ✅

4. **Fix Component Defaults** ⏸️ PARTIAL
   - GridfinityCalculator has hardcoded mm values but unit defaults to inches
   - Sync default values with unit selection
   - Ensure proper initial state

### Phase 2: State Management Refactor (Priority: HIGH) ✅ COMPLETED
**Timeline**: 3-4 hours
**Risk**: Medium
**Impact**: Very High

#### Tasks:
1. **Create Custom Hooks** ✅ COMPLETED
   ```javascript
   // hooks/useDrawerSettings.js
   - useDrawerDimensions(initialSize, unit)
   - usePrinterSettings(initialPrinter)
   - useBinOptions()
   - useDrawerCount()
   ```
   ✅ Created:
   - `useGridfinitySettings` - Main settings hook
   - `usePersistedState` - Generic persisted state hook
   - `useLegacyMigration` - Migration hook
   - `useCustomPrinter` - Custom printer dimensions hook

2. **Extract Settings Context** ✅ COMPLETED
   ```javascript
   // contexts/SettingsContext.jsx
   - Centralized settings state ✅
   - Persistence logic ✅
   - Settings validation ✅
   - Individual setting hooks (useDrawerSettings, usePrinterSettings, etc.) ✅
   ```

3. **Create Calculation Hook** ✅ COMPLETED
   ```javascript
   // hooks/useGridfinityCalculation.js
   - Encapsulate calculation logic ✅
   - Memoize expensive calculations ✅
   - Return results and layout ✅
   ```

### Phase 3: Feature Enhancements (Priority: MEDIUM) ✅ COMPLETED
**Timeline**: 2-3 hours
**Risk**: Low
**Impact**: High

#### Tasks:
1. **Custom Printer Dimensions** ✅ COMPLETED
   - Add input fields for custom X, Y, Z ✅
   - Validate dimensions ✅
   - Save custom presets ✅

2. **Unit Conversion Service** ✅ COMPLETED
   ```javascript
   // services/unitConversion.js
   - convertToMm(value, fromUnit) ✅
   - convertFromMm(value, toUnit) ✅
   - formatDimension(value, unit, precision) ✅
   ```

3. **Enhanced PrinterSettings Component** ✅ COMPLETED
   - Show actual dimensions for selected printer ✅
   - Visual preview of build volume ✅
   - Custom dimension inputs when "Custom" selected ✅

### Phase 4: Architecture Improvements with TypeScript (Priority: MEDIUM) ⏸️ PARTIALLY COMPLETE
**Timeline**: 4-5 hours
**Risk**: Medium
**Impact**: High

#### Tasks:
1. **TypeScript Migration** ✅ COMPLETED
   - Core utilities migrated to TypeScript ✅
     - `unitMath.ts` ✅
     - `unitConversion.ts` ✅
     - `gridfinityUtils.ts` ✅
   - Type definitions created (`src/types/gridfinity.ts`) ✅
   - All hooks migrated to TypeScript ✅
   - All components migrated to TypeScript ✅
   - All test files migrated to TypeScript ✅
   - ESLint configured for TypeScript ✅
   - Build configuration updated ✅
   - 100% TypeScript migration - 0 JS/JSX files remaining ✅
   - All 168 tests passing with TypeScript ✅

2. **Service Layer** ⏸️ IN PROGRESS
   ```typescript
   // services/
   ├── storage.ts         // localStorage abstraction ✅
   ├── calculation.ts     // Gridfinity calculations ✅
   ├── validation.ts      // Input validation ✅
   ├── export.ts          // Export functionality ✅
   └── index.ts           // Service exports ✅
   ```

3. **Component Restructure** ❌ NOT STARTED (attempted but needs rework)
   ```
   components/
   ├── Calculator/
   │   ├── index.jsx                    // Main container
   │   ├── CalculatorProvider.jsx       // Context provider
   │   └── hooks/
   │       ├── useCalculator.js
   │       └── useSettings.js
   ├── InputSections/
   │   ├── DrawerDimensions/
   │   ├── PrinterSettings/
   │   ├── BinOptions/
   │   └── DrawerOptions/
   └── Results/
       ├── ResultsSummary/
       └── VisualPreview/
   ```

4. **Type Safety** ✅ COMPLETED
   - Migrated entire codebase to TypeScript ✅
   - Defined interfaces for all data structures ✅
   - Type-safe API boundaries ✅

### Phase 5: User Experience (Priority: LOW)
**Timeline**: 2-3 hours
**Risk**: Low
**Impact**: Medium

#### Tasks:
1. **Presets & Templates**
   - Common drawer sizes
   - Save user configurations
   - Share configurations via URL

2. **Export Functionality**
   - Export as JSON
   - Export as CSV
   - Print-friendly view

3. **Advanced Visualization**
   - 3D preview option
   - Drag-and-drop layout editing
   - Show dimension labels

### Phase 6: Performance Optimization (Priority: LOW)
**Timeline**: 1-2 hours
**Risk**: Low
**Impact**: Low-Medium

#### Tasks:
1. **Memoization**
   - useMemo for expensive calculations
   - React.memo for pure components
   - useCallback for event handlers

2. **Code Splitting**
   - Lazy load visualization component
   - Dynamic import for advanced features

3. **Bundle Optimization**
   - Analyze bundle size
   - Remove unused dependencies
   - Optimize images/assets

## Implementation Order

### Week 1: Foundation ✅ COMPLETED
1. Phase 1: Clean Up & Stabilize ✅ COMPLETED
2. Phase 2: State Management Refactor ✅ COMPLETED
3. **BONUS**: MathJS Integration ✅ COMPLETED
   - Created unitMath service with BigNumber precision
   - Replaced all floating-point operations
   - Fixed precision issues throughout codebase
4. **BONUS**: Fixed half-size bin spacer bug ✅ COMPLETED
5. **BONUS**: Created Settings Context ✅ COMPLETED
   - Implemented SettingsProvider for global state
   - Created individual hooks for specific settings
   - Updated all tests to work with context

### Week 2: Core Improvements ✅ COMPLETED
1. Phase 3: Feature Enhancements ✅ COMPLETED
   - Custom printer UI implemented ✅
   - Unit conversion service created ✅
   - Enhanced PrinterSettings component ✅

### Week 3: Architecture ⏸️ IN PROGRESS
1. Phase 4: Architecture Improvements
   - TypeScript Migration ✅ COMPLETED
   - Service Layer ⏸️ IN PROGRESS (services created but not integrated)
   - Component Restructure ❌ NOT STARTED

### Week 4: Polish
1. Phase 5: User Experience
2. Phase 6: Performance Optimization

## Success Metrics

### Code Quality
- [x] No console.log in production code ✅
- [x] Consistent import paths ✅
- [x] <300 lines per component file ✅
- [x] 80%+ test coverage maintained ✅
- [x] TypeScript migration complete ✅
- [x] Full type safety across codebase ✅
- [ ] No ESLint warnings (some @typescript-eslint/no-explicit-any warnings remain)

### User Experience
- [x] Custom printer dimensions available ✅
- [x] Settings persist correctly ✅
- [x] Calculations < 50ms ✅ (using MathJS for precision)
- [ ] Responsive on mobile devices

### Maintainability
- [x] Clear separation of concerns ✅ (Settings Context, custom hooks)
- [x] TypeScript provides self-documenting APIs ✅
- [x] Reusable hooks and utilities ✅
- [x] Consistent naming conventions ✅

## Risk Mitigation

1. **Test Coverage**: Write tests before refactoring
2. **Incremental Changes**: Small, focused PRs
3. **Feature Flags**: Toggle new features during development
4. **Rollback Plan**: Git tags at each phase completion
5. **User Testing**: Get feedback after each major phase

## Technical Debt to Address

1. Missing error boundaries
2. No loading states
3. No error handling for edge cases
4. No accessibility testing
5. No internationalization support
6. No analytics/telemetry
7. No keyboard shortcuts
8. No undo/redo functionality
9. ~~Floating-point precision issues~~ ✅ FIXED with MathJS
10. ~~Half-size bin spacer generation bug~~ ✅ FIXED

## Future Considerations

1. **Backend Integration**
   - User accounts
   - Saved configurations
   - Community sharing

2. **Mobile App**
   - React Native version
   - Offline support
   - Camera measurement

3. **Advanced Features**
   - AI-powered optimization
   - Multi-drawer layouts
   - Cost estimation
   - Print time estimation

## Notes

- Maintain backward compatibility with localStorage ✅
- Keep the app functional during refactor ✅
- Document breaking changes ✅
- Consider creating a v2 branch for major changes

## Completed Achievements

### Beyond Original Scope
1. **MathJS Integration** - Fixed all floating-point precision issues
2. **Half-Size Bin Bug Fix** - Spacers now correctly generated with half-size bins
3. **100% TypeScript Migration** - Entire codebase converted from JavaScript
4. **Settings Context** - Global state management with React Context
5. **Custom Printer UI** - Full dialog for custom printer dimensions

### Development Stats
- **Files Migrated**: ~47 files from JS/JSX to TS/TSX
- **Type Coverage**: 100% of source code
- **Tests**: All 168 tests passing
- **Build Time**: ~3 seconds
- **Bundle Size**: ~1MB (before optimization)
- **Service Layer**: 4 core services created but not fully integrated
- **ESLint**: 0 errors, 39 warnings remaining