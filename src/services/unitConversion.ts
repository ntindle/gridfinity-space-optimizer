/**
 * Unit Conversion Service
 * Handles all unit conversions throughout the application
 * Now uses mathjs for precise calculations to avoid floating-point errors
 */

import { unitMath, INCH_TO_MM } from './unitMath';
import type { PrinterSize } from '@/types';

export { INCH_TO_MM };

/**
 * Convert a value to millimeters
 */
export const convertToMm = (value: number, fromUnit: string = 'in'): number => {
  if (fromUnit === 'mm') return value;
  if (fromUnit === 'in') return unitMath.convert(value, 'inch', 'mm');
  throw new Error(`Unknown unit: ${fromUnit}`);
};

/**
 * Convert a value from millimeters
 */
export const convertFromMm = (value: number, toUnit: string = 'in'): number => {
  if (toUnit === 'mm') return value;
  if (toUnit === 'in') return unitMath.convert(value, 'mm', 'inch');
  throw new Error(`Unknown unit: ${toUnit}`);
};

/**
 * Format a dimension value with appropriate precision
 */
export const formatDimension = (
  value: number, 
  unit: string = 'mm', 
  precision: number | null = null
): string => {
  if (precision === null) {
    precision = unit === 'mm' ? 0 : 1;
  }
  
  const formatted = value.toFixed(precision);
  const unitSuffix = unit === 'mm' ? 'mm' : '"';
  return `${formatted}${unitSuffix}`;
};

/**
 * Format a dimension object (x, y, z) with units
 */
export const formatBuildVolume = (
  dimensions: Partial<PrinterSize> | null, 
  useMm: boolean = true
): string => {
  if (!dimensions) return '';
  
  const { x = 0, y = 0, z } = dimensions;
  const unit = useMm ? 'mm' : 'in';
  
  const xVal = useMm ? x : convertFromMm(x, 'in');
  const yVal = useMm ? y : convertFromMm(y, 'in');
  const zVal = useMm ? (z || x) : convertFromMm(z || x, 'in');
  
  return `${formatDimension(xVal, unit)} × ${formatDimension(yVal, unit)} × ${formatDimension(zVal, unit)}`;
};

/**
 * Result of parsing a dimension string
 */
export interface ParsedDimension {
  value: number;
  unit: string;
}

/**
 * Parse a dimension string (e.g., "10.5" or "256mm") to a number
 */
export const parseDimension = (
  input: string | number, 
  defaultUnit: string = 'mm'
): ParsedDimension => {
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
 * Options for dimension validation
 */
export interface DimensionValidationOptions {
  min?: number;      // Minimum value in mm
  max?: number;      // Maximum value in mm
  allowZero?: boolean;
}

/**
 * Validate dimension value
 * Returns { valid: boolean, error?: string } for backward compatibility
 */
export const validateDimension = (
  value: number, 
  options: DimensionValidationOptions = {}
): { valid: boolean; error?: string } => {
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