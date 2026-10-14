


export type PreciseNumber = number & { readonly __brand: 'PreciseNumber' };


export type LengthUnit = 'mm' | 'inch' | 'inches' | 'in';


export interface UnitValue<U extends LengthUnit = LengthUnit> {
  value: PreciseNumber;
  unit: U;
}


export type Millimeters = PreciseNumber & { readonly __unit: 'mm' };


export type Inches = PreciseNumber & { readonly __unit: 'inches' };


export type GridSize = Millimeters;


export interface MathResult {
  toPrecise(): PreciseNumber;
  toNumber(): number;
  toString(): string;
}


export type ComparisonResult = boolean;


export type RoundingMode = 'floor' | 'ceil' | 'round';


export interface MathConfig {
  precision: number;
  rounding: RoundingMode;
}


export interface PreciseMath {
  
  from(value: number): PreciseNumber;
  fromString(value: string): PreciseNumber;
  
  
  add(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  subtract(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  multiply(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  divide(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  mod(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  
  
  round(value: PreciseNumber, decimals?: number): PreciseNumber;
  floor(value: PreciseNumber): PreciseNumber;
  ceil(value: PreciseNumber): PreciseNumber;
  
  
  equal(a: PreciseNumber, b: PreciseNumber): boolean;
  approxEqual(a: PreciseNumber, b: PreciseNumber, tolerance?: PreciseNumber): boolean;
  lessThan(a: PreciseNumber, b: PreciseNumber): boolean;
  lessOrEqual(a: PreciseNumber, b: PreciseNumber): boolean;
  greaterThan(a: PreciseNumber, b: PreciseNumber): boolean;
  greaterOrEqual(a: PreciseNumber, b: PreciseNumber): boolean;
  
  
  min(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  max(a: PreciseNumber, b: PreciseNumber): PreciseNumber;
  
  
  toNumber(value: PreciseNumber): number;
  toString(value: PreciseNumber, decimals?: number): string;
}


export interface UnitConverter {
  
  toMillimeters(value: PreciseNumber, fromUnit: LengthUnit): Millimeters;
  fromMillimeters(value: Millimeters, toUnit: LengthUnit): PreciseNumber;
  
  
  convert<F extends LengthUnit, T extends LengthUnit>(
    value: UnitValue<F>, 
    toUnit: T
  ): UnitValue<T>;
  
  
  inchesToMm(inches: Inches): Millimeters;
  mmToInches(mm: Millimeters): Inches;
}


export interface GridCalculation {
  gridCount: PreciseNumber;
  remainder: Millimeters;
  totalSize: Millimeters;
}


export interface DimensionBounds {
  min: Millimeters;
  max: Millimeters;
}


export function isPreciseNumber(value: unknown): value is PreciseNumber {
  return typeof value === 'number';
}


export function isMillimeters(value: unknown): value is Millimeters {
  return typeof value === 'number';
}


export function isInches(value: unknown): value is Inches {
  return typeof value === 'number';
}