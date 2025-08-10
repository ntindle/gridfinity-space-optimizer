import { create, all } from 'mathjs';

// Create a mathjs instance with BigNumber for precise calculations
const math = create(all);

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
   * @param {number} value - The value to convert
   * @param {string} fromUnit - The unit to convert from (e.g., 'inch', 'mm')
   * @param {string} toUnit - The unit to convert to (e.g., 'inch', 'mm')
   * @returns {number} The converted value
   */
  convert: (value, fromUnit, toUnit) => {
    if (fromUnit === toUnit) return value;
    
    // Handle the specific inch to mm conversion we use
    if (fromUnit === 'inch' && toUnit === 'mm') {
      return math.number(math.multiply(math.bignumber(value), math.bignumber(25.4)));
    }
    if (fromUnit === 'mm' && toUnit === 'inch') {
      return math.number(math.divide(math.bignumber(value), math.bignumber(25.4)));
    }
    
    // For other unit conversions, use mathjs unit system
    return math.number(math.unit(value, fromUnit).toNumber(toUnit));
  },
  
  /**
   * Round to specific decimal places
   * @param {number} value - The value to round
   * @param {number} decimals - Number of decimal places (default: 2)
   * @returns {number} The rounded value
   */
  round: (value, decimals = 2) => {
    return math.number(math.round(math.bignumber(value), decimals));
  },
  
  /**
   * Check if values are approximately equal (within tolerance)
   * @param {number} a - First value
   * @param {number} b - Second value
   * @param {number} tolerance - Tolerance for comparison (default: 0.01)
   * @returns {boolean} True if values are approximately equal
   */
  approxEqual: (a, b, tolerance = 0.01) => {
    const diff = math.abs(math.subtract(math.bignumber(a), math.bignumber(b)));
    return math.smaller(diff, tolerance);
  },
  
  /**
   * Precise multiplication
   * @param {number} a - First value
   * @param {number} b - Second value
   * @returns {number} The product
   */
  multiply: (a, b) => {
    return math.number(math.multiply(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Precise division
   * @param {number} a - Dividend
   * @param {number} b - Divisor
   * @returns {number} The quotient
   */
  divide: (a, b) => {
    return math.number(math.divide(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Precise addition
   * @param {number} a - First value
   * @param {number} b - Second value
   * @returns {number} The sum
   */
  add: (a, b) => {
    return math.number(math.add(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Precise subtraction
   * @param {number} a - Minuend
   * @param {number} b - Subtrahend
   * @returns {number} The difference
   */
  subtract: (a, b) => {
    return math.number(math.subtract(math.bignumber(a), math.bignumber(b)));
  },
  
  /**
   * Floor division with precision
   * @param {number} value - Value to floor
   * @returns {number} The floored value
   */
  floor: (value) => {
    return math.number(math.floor(math.bignumber(value)));
  },
  
  /**
   * Modulo operation with precision
   * @param {number} a - Dividend
   * @param {number} b - Divisor
   * @returns {number} The remainder
   */
  mod: (a, b) => {
    return math.number(math.mod(math.bignumber(a), math.bignumber(b)));
  }
};

// Export conversion constants for backward compatibility
export const INCH_TO_MM = 25.4;