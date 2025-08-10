/**
 * Unit Conversion Service
 * Handles all unit conversions throughout the application
 * Now uses mathjs for precise calculations to avoid floating-point errors
 */

import { unitMath, INCH_TO_MM } from './unitMath';

export { INCH_TO_MM };

/**
 * Convert a value to millimeters
 * @param {number} value - The value to convert
 * @param {string} fromUnit - The unit to convert from ('in' or 'mm')
 * @returns {number} The value in millimeters
 */
export const convertToMm = (value, fromUnit = 'in') => {
  if (fromUnit === 'mm') return value;
  if (fromUnit === 'in') return unitMath.convert(value, 'inch', 'mm');
  throw new Error(`Unknown unit: ${fromUnit}`);
};

/**
 * Convert a value from millimeters
 * @param {number} value - The value in millimeters
 * @param {string} toUnit - The unit to convert to ('in' or 'mm')
 * @returns {number} The value in the target unit
 */
export const convertFromMm = (value, toUnit = 'in') => {
  if (toUnit === 'mm') return value;
  if (toUnit === 'in') return unitMath.convert(value, 'mm', 'inch');
  throw new Error(`Unknown unit: ${toUnit}`);
};

/**
 * Format a dimension value with appropriate precision
 * @param {number} value - The value to format
 * @param {string} unit - The unit ('in' or 'mm')
 * @param {number} precision - Number of decimal places
 * @returns {string} Formatted dimension string
 */
export const formatDimension = (value, unit = 'mm', precision = null) => {
  if (precision === null) {
    precision = unit === 'mm' ? 0 : 1;
  }
  
  const formatted = value.toFixed(precision);
  const unitSuffix = unit === 'mm' ? 'mm' : '"';
  return `${formatted}${unitSuffix}`;
};

/**
 * Format a dimension object (x, y, z) with units
 * @param {Object} dimensions - Object with x, y, z properties
 * @param {boolean} useMm - Whether to use millimeters
 * @returns {string} Formatted string like "256mm × 256mm × 256mm"
 */
export const formatBuildVolume = (dimensions, useMm = true) => {
  if (!dimensions) return '';
  
  const { x, y, z } = dimensions;
  const unit = useMm ? 'mm' : 'in';
  
  const xVal = useMm ? x : convertFromMm(x, 'in');
  const yVal = useMm ? y : convertFromMm(y, 'in');
  const zVal = useMm ? (z || x) : convertFromMm(z || x, 'in');
  
  return `${formatDimension(xVal, unit)} × ${formatDimension(yVal, unit)} × ${formatDimension(zVal, unit)}`;
};

/**
 * Parse a dimension string (e.g., "10.5" or "256mm") to a number
 * @param {string} input - The input string
 * @param {string} defaultUnit - Default unit if not specified
 * @returns {Object} { value: number, unit: string }
 */
export const parseDimension = (input, defaultUnit = 'mm') => {
  if (typeof input === 'number') {
    return { value: input, unit: defaultUnit };
  }
  
  const str = String(input).trim();
  const match = str.match(/^([\d.]+)\s*(mm|in|")?$/i);
  
  if (!match) {
    throw new Error(`Invalid dimension format: ${input}`);
  }
  
  const value = parseFloat(match[1]);
  let unit = match[2] || defaultUnit;
  
  // Normalize unit
  if (unit === '"') unit = 'in';
  unit = unit.toLowerCase();
  
  return { value, unit };
};

/**
 * Validate dimension value
 * @param {number} value - The dimension value in mm
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateDimension = (value, options = {}) => {
  const {
    min = 10,      // Minimum 10mm
    max = 1000,    // Maximum 1000mm (1 meter)
    allowZero = false,
  } = options;
  
  if (!allowZero && value <= 0) {
    return { valid: false, error: 'Dimension must be greater than zero' };
  }
  
  if (allowZero && value === 0) {
    return { valid: true };
  }
  
  if (value < min) {
    return { valid: false, error: `Dimension must be at least ${formatDimension(min, 'mm')}` };
  }
  
  if (value > max) {
    return { valid: false, error: `Dimension must not exceed ${formatDimension(max, 'mm')}` };
  }
  
  return { valid: true };
};