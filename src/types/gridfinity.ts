/**
 * Core type definitions for Gridfinity Space Optimizer
 */

/**
 * Drawer dimensions in inches
 */
export interface DrawerSize {
  width: number;  // in inches
  height: number; // in inches
}

/**
 * 3D printer build volume in millimeters
 */
export interface PrinterSize {
  x: number;  // in mm
  y: number;  // in mm
  z: number;  // in mm
  exclusionZone?: {
    front?: number;  // mm from front edge
    back?: number;   // mm from back edge
    left?: number;   // mm from left edge
    right?: number;  // mm from right edge
  };
}

/**
 * Individual item in the layout grid
 */
export interface LayoutItem {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'baseplate' | 'spacer' | 'half-size';
  pixelX: number;
  pixelY: number;
  pixelWidth: number;
  pixelHeight: number;
}

/**
 * Result of gridfinity calculation
 */
export interface GridfinityResult {
  baseplates: Record<string, number>;
  spacers: Record<string, number>;
  halfSizeBins: Record<string, number>;
  layout: LayoutItem[];
}

/**
 * Application settings
 */
export interface Settings {
  drawerSize: DrawerSize;
  selectedPrinter: string;
  customPrinterSize: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
  numDrawers: number;
  useMm: boolean;
}

/**
 * Calculation input parameters
 */
export interface CalculationParams {
  drawerSize: DrawerSize;
  printerSize: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
}

/**
 * Options for persisted state hook
 */
export interface PersistOptions<T = unknown> {
  syncTabs?: boolean;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

/**
 * Printer presets (predefined printer sizes)
 */
export type PrinterPresets = Record<string, PrinterSize>;

/**
 * Unit types for conversion
 */
export type Unit = 'mm' | 'inch' | 'inches';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Custom printer dialog state
 */
export interface CustomPrinterState {
  dimensions: PrinterSize;
  errors: {
    x?: string;
    y?: string;
    z?: string;
  };
}