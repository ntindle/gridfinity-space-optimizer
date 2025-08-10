/**
 * Type definitions for precise mathematical operations
 */

/**
 * A precise number that should only be manipulated through unitMath operations
 * This is a branded type to prevent accidental usage of native math operations
 */
export type PreciseNumber = number & { readonly __brand: 'PreciseNumber' };

/**
 * Units supported by the application
 */
export type LengthUnit = 'mm' | 'inch' | 'inches' | 'in';

/**
 * A value with an associated unit
 */
export interface UnitValue<U extends LengthUnit = LengthUnit> {
  value: PreciseNumber;
  unit: U;
}

/**
 * Dimension in millimeters (internal representation)
 */
export type Millimeters = PreciseNumber & { readonly __unit: 'mm' };

/**
 * Dimension in inches
 */
export type Inches = PreciseNumber & { readonly __unit: 'inches' };

/**
 * Grid size type for type safety
 */
export type GridSize = Millimeters;

/**
 * Math operation result that needs to be explicitly converted to PreciseNumber
 */
export interface MathResult {
  toPrecise(): PreciseNumber;
  toNumber(): number;
  toString(): string;
}

/**
 * Comparison result
 */
export type ComparisonResult = boolean;

/**
 * Rounding modes
 */
export type RoundingMode = 'floor' | 'ceil' | 'round';

/**
 * Math configuration
 */
export interface MathConfig {
  precision: number;
  rounding: RoundingMode;
}

/**
 * Type-safe math operations interface
 */
export interface PreciseMath {
  // Creation
  from(value: number): PreciseNumber;
  fromString(value: string): PreciseNumber;
  
  // Arithmetic
  add(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  subtract(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  multiply(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  divide(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  mod(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  
  // Rounding
  round(value: PreciseNumber, decimals?: number): PreciseNumber;
  floor(value: PreciseNumber): PreciseNumber;
  ceil(value: PreciseNumber): PreciseNumber;
  
  // Comparison
  equal(a: PreciseNumber, b: PreciseNumber): boolean;
  approxEqual(a: PreciseNumber, b: PreciseNumber, tolerance?: PreciseNumber): boolean;
  lessThan(a: PreciseNumber, b: PreciseNumber): boolean;
  lessOrEqual(a: PreciseNumber, b: PreciseNumber): boolean;
  greaterThan(a: PreciseNumber, b: PreciseNumber): boolean;
  greaterOrEqual(a: PreciseNumber, b: PreciseNumber): boolean;
  
  // Min/Max
  min(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  max(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  
  // Conversion
  toNumber(value: PreciseNumber): number;
  toString(value: PreciseNumber, decimals?: number): string;
}

/**
 * Type-safe unit conversion interface
 */
export interface UnitConverter {
  // Length conversions
  toMillimeters(value: PreciseNumber, fromUnit: LengthUnit): Millimeters;
  fromMillimeters(value: Millimeters, toUnit: LengthUnit): PreciseNumber;
  
  // Generic conversion
  convert<F extends LengthUnit, T extends LengthUnit>(
    value: UnitValue<F>, 
    toUnit: T
  ): UnitValue<T>;
  
  // Direct conversions
  inchesToMm(inches: Inches): Millimeters;
  mmToInches(mm: Millimeters): Inches;
}

/**
 * Grid calculation types
 */
export interface GridCalculation {
  gridCount: PreciseNumber;
  remainder: Millimeters;
  totalSize: Millimeters;
}

/**
 * Dimension validation
 */
export interface DimensionBounds {
  min: Millimeters;
  max: Millimeters;
}

/**
 * Type guard for PreciseNumber
 */
export function isPreciseNumber(value: unknown): value is PreciseNumber {
  return typeof value === 'number';
}

/**
 * Type guard for Millimeters
 */
export function isMillimeters(value: unknown): value is Millimeters {
  return typeof value === 'number';
}

/**
 * Type guard for Inches
 */
export function isInches(value: unknown): value is Inches {
  return typeof value === 'number';
}