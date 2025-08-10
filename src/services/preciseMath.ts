import { create, all, MathJsInstance, BigNumber } from 'mathjs';
import type { 
  PreciseNumber, 
  PreciseMath, 
  UnitConverter, 
  Millimeters, 
  Inches,
  LengthUnit,
  UnitValue
} from '@/types/math';

// Create a mathjs instance with BigNumber for precise calculations
const math: MathJsInstance = create(all);

// Configure for precise decimal calculations
math.config({
  number: 'BigNumber',
  precision: 64
});

/**
 * Type-safe precise math operations
 * All operations maintain precision and prevent accidental use of native JS math
 */
export const preciseMath: PreciseMath = {
  /**
   * Create a PreciseNumber from a regular number
   */
  from(value: number): PreciseNumber {
    // Validate input
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot create PreciseNumber from non-finite value: ${value}`);
    }
    return math.number(math.bignumber(value)) as PreciseNumber;
  },

  /**
   * Create a PreciseNumber from a string
   */
  fromString(value: string): PreciseNumber {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Cannot parse PreciseNumber from string: ${value}`);
    }
    return math.number(math.bignumber(value)) as PreciseNumber;
  },

  /**
   * Add two precise numbers
   */
  add(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.add(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  /**
   * Subtract two precise numbers
   */
  subtract(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.subtract(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  /**
   * Multiply two precise numbers
   */
  multiply(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    const result = math.multiply(math.bignumber(a), math.bignumber(b));
    return math.number(result as BigNumber) as PreciseNumber;
  },

  /**
   * Divide two precise numbers
   */
  divide(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = math.divide(math.bignumber(a), math.bignumber(b));
    return math.number(result as BigNumber) as PreciseNumber;
  },

  /**
   * Modulo operation
   */
  mod(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.mod(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  /**
   * Round to specified decimal places
   */
  round(value: PreciseNumber, decimals: number = 2): PreciseNumber {
    return math.number(math.round(math.bignumber(value), decimals)) as PreciseNumber;
  },

  /**
   * Floor operation
   */
  floor(value: PreciseNumber): PreciseNumber {
    return math.number(math.floor(math.bignumber(value))) as PreciseNumber;
  },

  /**
   * Ceiling operation
   */
  ceil(value: PreciseNumber): PreciseNumber {
    return math.number(math.ceil(math.bignumber(value))) as PreciseNumber;
  },

  /**
   * Check if two numbers are exactly equal
   */
  equal(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.equal(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  /**
   * Check if two numbers are approximately equal within tolerance
   */
  approxEqual(a: PreciseNumber, b: PreciseNumber, tolerance: PreciseNumber = 0.01 as PreciseNumber): boolean {
    const diff = math.abs(math.subtract(math.bignumber(a), math.bignumber(b)));
    return math.smaller(diff, tolerance) as boolean;
  },

  /**
   * Less than comparison
   */
  lessThan(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.smaller(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  /**
   * Less than or equal comparison
   */
  lessOrEqual(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.smallerEq(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  /**
   * Greater than comparison
   */
  greaterThan(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.larger(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  /**
   * Greater than or equal comparison
   */
  greaterOrEqual(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.largerEq(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  /**
   * Get minimum of two values
   */
  min(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.min(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  /**
   * Get maximum of two values
   */
  max(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.max(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  /**
   * Convert to regular number (use with caution!)
   */
  toNumber(value: PreciseNumber): number {
    return Number(value);
  },

  /**
   * Convert to string with optional decimal places
   */
  toString(value: PreciseNumber, decimals?: number): string {
    if (decimals !== undefined) {
      return preciseMath.round(value, decimals).toFixed(decimals);
    }
    return value.toString();
  }
};

/**
 * Type-safe unit conversions
 */
export const unitConverter: UnitConverter = {
  /**
   * Convert any length unit to millimeters
   */
  toMillimeters(value: PreciseNumber, fromUnit: LengthUnit): Millimeters {
    if (fromUnit === 'mm') {
      return value as Millimeters;
    }
    
    if (fromUnit === 'inch' || fromUnit === 'inches' || fromUnit === 'in') {
      const mm = preciseMath.multiply(value, preciseMath.from(25.4));
      return mm as Millimeters;
    }
    
    throw new Error(`Unknown unit: ${fromUnit}`);
  },

  /**
   * Convert millimeters to any length unit
   */
  fromMillimeters(value: Millimeters, toUnit: LengthUnit): PreciseNumber {
    if (toUnit === 'mm') {
      return value as PreciseNumber;
    }
    
    if (toUnit === 'inch' || toUnit === 'inches' || toUnit === 'in') {
      return preciseMath.divide(value as PreciseNumber, preciseMath.from(25.4));
    }
    
    throw new Error(`Unknown unit: ${toUnit}`);
  },

  /**
   * Generic unit conversion
   */
  convert<F extends LengthUnit, T extends LengthUnit>(
    value: UnitValue<F>, 
    toUnit: T
  ): UnitValue<T> {
    const mm = this.toMillimeters(value.value, value.unit);
    const converted = this.fromMillimeters(mm, toUnit);
    return {
      value: converted,
      unit: toUnit
    };
  },

  /**
   * Direct inch to mm conversion
   */
  inchesToMm(inches: Inches): Millimeters {
    return this.toMillimeters(inches as PreciseNumber, 'inches');
  },

  /**
   * Direct mm to inch conversion
   */
  mmToInches(mm: Millimeters): Inches {
    return this.fromMillimeters(mm, 'inches') as Inches;
  }
};

/**
 * Constants as PreciseNumbers
 */
export const PRECISE_CONSTANTS = {
  INCH_TO_MM: preciseMath.from(25.4),
  FULL_GRID_SIZE: preciseMath.from(42) as Millimeters,
  HALF_GRID_SIZE: preciseMath.from(21) as Millimeters,
  ZERO: preciseMath.from(0),
  ONE: preciseMath.from(1),
  HALF: preciseMath.from(0.5),
} as const;

/**
 * Helper function to create a PreciseNumber (shorter alias)
 */
export const p = preciseMath.from;

/**
 * Helper function for common grid calculations
 */
export function calculateGridCount(size: Millimeters, gridSize: Millimeters): PreciseNumber {
  return preciseMath.floor(preciseMath.divide(
    size as PreciseNumber, 
    gridSize as PreciseNumber
  ));
}

/**
 * Helper function to calculate remainder
 */
export function calculateRemainder(size: Millimeters, gridSize: Millimeters): Millimeters {
  const gridCount = calculateGridCount(size, gridSize);
  const used = preciseMath.multiply(gridCount, gridSize as PreciseNumber);
  return preciseMath.subtract(size as PreciseNumber, used) as Millimeters;
}

/**
 * Check if a dimension is effectively zero (within tolerance)
 */
export function isEffectivelyZero(value: PreciseNumber, tolerance: PreciseNumber = p(0.01)): boolean {
  return preciseMath.approxEqual(value, PRECISE_CONSTANTS.ZERO, tolerance);
}