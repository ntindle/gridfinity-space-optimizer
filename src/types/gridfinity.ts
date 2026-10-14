
export interface DrawerSize {
  width: number;
  height: number;
}

export interface PrinterSize {
  x: number;
  y: number;
  z: number;
  exclusionZone?: {
    front?: number;
    back?: number;
    left?: number;
    right?: number;
  };
}

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

export interface GridfinityResult {
  baseplates: Record<string, number>;
  spacers: Record<string, number>;
  halfSizeBins: Record<string, number>;
  layout: LayoutItem[];
}

export interface Settings {
  drawerSize: DrawerSize;
  selectedPrinter: string;
  customPrinterSize: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
  numDrawers: number;
  useMm: boolean;
}

export interface CalculationParams {
  drawerSize: DrawerSize;
  printerSize: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
}

export interface PersistOptions<T = unknown> {
  syncTabs?: boolean;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

export type PrinterPresets = Record<string, PrinterSize>;

export type Unit = 'mm' | 'inch' | 'inches';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface CustomPrinterState {
  dimensions: PrinterSize;
  errors: {
    x?: string;
    y?: string;
    z?: string;
  };
}