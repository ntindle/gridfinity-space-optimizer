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


const math: MathJsInstance = create(all);


math.config({
  number: 'BigNumber',
  precision: 64
});


export const preciseMath: PreciseMath = {
  
  from(value: number): PreciseNumber {
    
    if (!Number.isFinite(value)) {
      throw new Error(`Cannot create PreciseNumber from non-finite value: ${value}`);
    }
    return math.number(math.bignumber(value)) as PreciseNumber;
  },

  
  fromString(value: string): PreciseNumber {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      throw new Error(`Cannot parse PreciseNumber from string: ${value}`);
    }
    return math.number(math.bignumber(value)) as PreciseNumber;
  },

  
  add(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.add(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  
  subtract(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.subtract(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  
  multiply(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    const result = math.multiply(math.bignumber(a), math.bignumber(b));
    return math.number(result as BigNumber) as PreciseNumber;
  },

  
  divide(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    const result = math.divide(math.bignumber(a), math.bignumber(b));
    return math.number(result as BigNumber) as PreciseNumber;
  },

  
  mod(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.mod(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  
  round(value: PreciseNumber, decimals: number = 2): PreciseNumber {
    return math.number(math.round(math.bignumber(value), decimals)) as PreciseNumber;
  },

  
  floor(value: PreciseNumber): PreciseNumber {
    return math.number(math.floor(math.bignumber(value))) as PreciseNumber;
  },

  
  ceil(value: PreciseNumber): PreciseNumber {
    return math.number(math.ceil(math.bignumber(value))) as PreciseNumber;
  },

  
  equal(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.equal(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  
  approxEqual(a: PreciseNumber, b: PreciseNumber, tolerance: PreciseNumber = 0.01 as PreciseNumber): boolean {
    const diff = math.abs(math.subtract(math.bignumber(a), math.bignumber(b)));
    return math.smaller(diff, tolerance) as boolean;
  },

  
  lessThan(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.smaller(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  
  lessOrEqual(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.smallerEq(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  
  greaterThan(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.larger(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  
  greaterOrEqual(a: PreciseNumber, b: PreciseNumber): boolean {
    return math.largerEq(math.bignumber(a), math.bignumber(b)) as boolean;
  },

  
  min(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.min(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  
  max(a: PreciseNumber, b: PreciseNumber): PreciseNumber {
    return math.number(math.max(math.bignumber(a), math.bignumber(b))) as PreciseNumber;
  },

  
  toNumber(value: PreciseNumber): number {
    return Number(value);
  },

  
  toString(value: PreciseNumber, decimals?: number): string {
    if (decimals !== undefined) {
      return preciseMath.round(value, decimals).toFixed(decimals);
    }
    return value.toString();
  }
};


export const unitConverter: UnitConverter = {
  
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

  
  fromMillimeters(value: Millimeters, toUnit: LengthUnit): PreciseNumber {
    if (toUnit === 'mm') {
      return value as PreciseNumber;
    }
    
    if (toUnit === 'inch' || toUnit === 'inches' || toUnit === 'in') {
      return preciseMath.divide(value as PreciseNumber, preciseMath.from(25.4));
    }
    
    throw new Error(`Unknown unit: ${toUnit}`);
  },

  
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

  
  inchesToMm(inches: Inches): Millimeters {
    return this.toMillimeters(inches as PreciseNumber, 'inches');
  },

  
  mmToInches(mm: Millimeters): Inches {
    return this.fromMillimeters(mm, 'inches') as Inches;
  }
};


export const PRECISE_CONSTANTS = {
  INCH_TO_MM: preciseMath.from(25.4),
  FULL_GRID_SIZE: preciseMath.from(42) as Millimeters,
  HALF_GRID_SIZE: preciseMath.from(21) as Millimeters,
  ZERO: preciseMath.from(0),
  ONE: preciseMath.from(1),
  HALF: preciseMath.from(0.5),
} as const;


export const p = preciseMath.from;


export function calculateGridCount(size: Millimeters, gridSize: Millimeters): PreciseNumber {
  return preciseMath.floor(preciseMath.divide(
    size as PreciseNumber, 
    gridSize as PreciseNumber
  ));
}


export function calculateRemainder(size: Millimeters, gridSize: Millimeters): Millimeters {
  const gridCount = calculateGridCount(size, gridSize);
  const used = preciseMath.multiply(gridCount, gridSize as PreciseNumber);
  return preciseMath.subtract(size as PreciseNumber, used) as Millimeters;
}


export function isEffectivelyZero(value: PreciseNumber, tolerance: PreciseNumber = p(0.01)): boolean {
  return preciseMath.approxEqual(value, PRECISE_CONSTANTS.ZERO, tolerance);
}