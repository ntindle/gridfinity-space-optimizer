import { describe, it, expect } from 'vitest';
import {
  INCH_TO_MM,
  convertToMm,
  convertFromMm,
  formatDimension,
  formatBuildVolume,
  parseDimension,
  validateDimension,
} from './unitConversion';
import type { PrinterSize, Unit, ValidationResult } from '@/types/gridfinity';

describe('unitConversion', () => {
  describe('constants', () => {
    it('should have correct inch to mm conversion factor', () => {
      expect(INCH_TO_MM).toBe(25.4);
    });
  });

  describe('convertToMm', () => {
    it('should return same value when unit is mm', () => {
      expect(convertToMm(100, 'mm')).toBe(100);
    });

    it('should convert inches to mm correctly', () => {
      expect(convertToMm(1, 'in')).toBe(25.4);
      expect(convertToMm(10, 'in')).toBe(254);
      expect(convertToMm(0.5, 'in')).toBe(12.7);
    });

    it('should default to inches when no unit specified', () => {
      expect(convertToMm(1)).toBe(25.4);
    });

    it('should throw error for unknown unit', () => {
      expect(() => convertToMm(100, 'cm' as Unit)).toThrow('Unknown unit: cm');
    });
  });

  describe('convertFromMm', () => {
    it('should return same value when unit is mm', () => {
      expect(convertFromMm(100, 'mm')).toBe(100);
    });

    it('should convert mm to inches correctly', () => {
      expect(convertFromMm(25.4, 'in')).toBe(1);
      expect(convertFromMm(254, 'in')).toBe(10);
      expect(convertFromMm(12.7, 'in')).toBe(0.5);
    });

    it('should default to inches when no unit specified', () => {
      expect(convertFromMm(25.4)).toBe(1);
    });

    it('should throw error for unknown unit', () => {
      expect(() => convertFromMm(100, 'cm' as Unit)).toThrow('Unknown unit: cm');
    });
  });

  describe('formatDimension', () => {
    it('should format mm with 0 decimal places by default', () => {
      expect(formatDimension(256, 'mm')).toBe('256mm');
      expect(formatDimension(256.789, 'mm')).toBe('257mm');
    });

    it('should format inches with 1 decimal place by default', () => {
      expect(formatDimension(10.1, 'in')).toBe('10.1"');
      expect(formatDimension(10.16, 'in')).toBe('10.2"');
    });

    it('should use custom precision when specified', () => {
      expect(formatDimension(256.789, 'mm', 2)).toBe('256.79mm');
      expect(formatDimension(10.1234, 'in', 3)).toBe('10.123"');
    });

    it('should default to mm when no unit specified', () => {
      expect(formatDimension(256)).toBe('256mm');
    });
  });

  describe('formatBuildVolume', () => {
    it('should format build volume in mm', () => {
      const dimensions: PrinterSize = { x: 256, y: 256, z: 256 };
      expect(formatBuildVolume(dimensions, true)).toBe('256mm × 256mm × 256mm');
    });

    it('should format build volume in inches', () => {
      const dimensions: PrinterSize = { x: 254, y: 254, z: 254 };
      expect(formatBuildVolume(dimensions, false)).toBe('10.0" × 10.0" × 10.0"');
    });

    it('should handle missing z dimension', () => {
      const dimensions = { x: 200, y: 200 } as PrinterSize;
      expect(formatBuildVolume(dimensions, true)).toBe('200mm × 200mm × 200mm');
    });

    it('should return empty string for null dimensions', () => {
      expect(formatBuildVolume(null, true)).toBe('');
      expect(formatBuildVolume(undefined, true)).toBe('');
    });
  });

  describe('parseDimension', () => {
    it('should parse number input', () => {
      expect(parseDimension(100)).toEqual({ value: 100, unit: 'mm' });
      expect(parseDimension(100, 'in')).toEqual({ value: 100, unit: 'in' });
    });

    it('should parse string with mm unit', () => {
      expect(parseDimension('100mm')).toEqual({ value: 100, unit: 'mm' });
      expect(parseDimension('100 mm')).toEqual({ value: 100, unit: 'mm' });
      expect(parseDimension('100MM')).toEqual({ value: 100, unit: 'mm' });
    });

    it('should parse string with inch unit', () => {
      expect(parseDimension('10in')).toEqual({ value: 10, unit: 'in' });
      expect(parseDimension('10 in')).toEqual({ value: 10, unit: 'in' });
      expect(parseDimension('10"')).toEqual({ value: 10, unit: 'in' });
    });

    it('should parse string without unit using default', () => {
      expect(parseDimension('100')).toEqual({ value: 100, unit: 'mm' });
      expect(parseDimension('100', 'in')).toEqual({ value: 100, unit: 'in' });
    });

    it('should handle decimal values', () => {
      expect(parseDimension('10.5mm')).toEqual({ value: 10.5, unit: 'mm' });
      expect(parseDimension('10.5"')).toEqual({ value: 10.5, unit: 'in' });
    });

    it('should throw error for invalid format', () => {
      expect(() => parseDimension('abc')).toThrow('Invalid dimension format: abc');
      expect(() => parseDimension('10 20')).toThrow('Invalid dimension format: 10 20');
      expect(() => parseDimension('')).toThrow('Invalid dimension format: ');
    });
  });

  describe('validateDimension', () => {
    it('should validate positive dimensions within range', () => {
      const result: ValidationResult = validateDimension(100);
      expect(result).toEqual({ valid: true });
      
      const result2: ValidationResult = validateDimension(500);
      expect(result2).toEqual({ valid: true });
    });

    it('should reject zero when not allowed', () => {
      const result: ValidationResult = validateDimension(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('greater than zero');
    });

    it('should allow zero when specified', () => {
      const result: ValidationResult = validateDimension(0, { allowZero: true });
      expect(result).toEqual({ valid: true });
    });

    it('should reject values below minimum', () => {
      const result: ValidationResult = validateDimension(5);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('at least');
    });

    it('should reject values above maximum', () => {
      const result: ValidationResult = validateDimension(1500);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not exceed');
    });

    it('should use custom min/max when specified', () => {
      const result1: ValidationResult = validateDimension(75, { min: 50, max: 100 });
      expect(result1).toEqual({ valid: true });
      
      const result2: ValidationResult = validateDimension(25, { min: 50, max: 100 });
      expect(result2.valid).toBe(false);
      
      const result3: ValidationResult = validateDimension(125, { min: 50, max: 100 });
      expect(result3.valid).toBe(false);
    });

    it('should include formatted dimension in error messages', () => {
      const result: ValidationResult = validateDimension(5, { min: 10 });
      expect(result.error).toContain('10mm');
    });
  });
});