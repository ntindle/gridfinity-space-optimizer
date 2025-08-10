import { create, all, MathJsInstance } from "mathjs";
import type { Unit } from '@/types';

// Create a mathjs instance with BigNumber for precise calculations
const math: MathJsInstance = create(all);

// Configure for precise decimal calculations
math.config({
  number: 'BigNumber',
  precision: 64
});

/**
 * Unit math service for precise calculations and conversions
 * Uses mathjs BigNumber to avoid floating-point precision issues
 */
export const unitMath = {
  /**
   * Convert between units with exact precision
   */
  convert: (value: number, fromUnit: Unit | string, toUnit: Unit | string): number => {
    if (fromUnit === toUnit) return value;
    
    // Handle the specific inch to mm conversion we use
    if (fromUnit === 'inch' && toUnit === 'mm') {
      const result = math.multiply(math.bignumber(value), math.bignumber(25.4));
      return math.number(result as math.BigNumber);
    }
    if (fromUnit === 'mm' && toUnit === 'inch') {
      const result = math.divide(math.bignumber(value), math.bignumber(25.4));
      return math.number(result as math.BigNumber);
    }
    
    // For other unit conversions, use mathjs unit system
    return math.number(math.unit(value, fromUnit).toNumber(toUnit));
  },
  
  /**
   * Round to specific decimal places
   */
  round: (value: number, decimals: number = 2): number => {
    return math.number(math.round(math.bignumber(value), decimals));
  },
  
  /**
   * Check if values are approximately equal (within tolerance)
   */
  approxEqual: (a: number, b: number, tolerance: number = 0.01): boolean => {
    const diff = math.abs(math.subtract(math.bignumber(a), math.bignumber(b)));
    return math.smaller(diff, tolerance) as boolean;
  },
  
  /**
   * Precise multiplication
   */
  multiply: (a: number, b: number): number => {
    const result = math.multiply(math.bignumber(a), math.bignumber(b));
    return math.number(result as math.BigNumber);
  },
  
  /**
   * Precise division
   */
  divide: (a: number, b: number): number => {
    const result = math.divide(math.bignumber(a), math.bignumber(b));
    return math.number(result as math.BigNumber);
  },
  
  /**
   * Precise addition
   */
  add: (a: number, b: number): number => {
    return math.number(math.add(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Precise subtraction
   */
  subtract: (a: number, b: number): number => {
    return math.number(math.subtract(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Floor division with precision
   */
  floor: (value: number): number => {
    return math.number(math.floor(math.bignumber(value)));
  },
  
  /**
   * Modulo operation with precision
   */
  mod: (a: number, b: number): number => {
    return math.number(math.mod(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Get minimum of two values
   */
  min: (a: number, b: number): number => {
    return math.number(math.min(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Get maximum of two values
   */
  max: (a: number, b: number): number => {
    return math.number(math.max(math.bignumber(a), math.bignumber(b)));
  }
} as const;

// Export conversion constants for backward compatibility
export const INCH_TO_MM = 25.4;