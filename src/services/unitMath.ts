import { create, all, MathJsInstance, BigNumber } from "mathjs";
import type { Unit } from '@/types';


const math: MathJsInstance = create(all);


math.config({
  number: 'BigNumber',
  precision: 64
});


export const unitMath = {
  
  convert: (value: number, fromUnit: Unit | string, toUnit: Unit | string): number => {
    if (fromUnit === toUnit) return value;
    
    
    if (fromUnit === 'inch' && toUnit === 'mm') {
      const result = math.multiply(math.bignumber(value), math.bignumber(25.4));
      return math.number(result as BigNumber);
    }
    if (fromUnit === 'mm' && toUnit === 'inch') {
      const result = math.divide(math.bignumber(value), math.bignumber(25.4));
      return math.number(result as BigNumber);
    }
    
    
    return math.number(math.unit(value, fromUnit).toNumber(toUnit));
  },
  
  
  round: (value: number, decimals: number = 2): number => {
    return math.number(math.round(math.bignumber(value), decimals));
  },
  
  
  approxEqual: (a: number, b: number, tolerance: number = 0.01): boolean => {
    const diff = math.abs(math.subtract(math.bignumber(a), math.bignumber(b)));
    return math.smaller(diff, tolerance) as boolean;
  },
  
  
  multiply: (a: number, b: number): number => {
    const result = math.multiply(math.bignumber(a), math.bignumber(b));
    return math.number(result as BigNumber);
  },
  
  
  divide: (a: number, b: number): number => {
    const result = math.divide(math.bignumber(a), math.bignumber(b));
    return math.number(result as BigNumber);
  },
  
  
  add: (a: number, b: number): number => {
    return math.number(math.add(math.bignumber(a), math.bignumber(b)));
  },
  
  
  subtract: (a: number, b: number): number => {
    return math.number(math.subtract(math.bignumber(a), math.bignumber(b)));
  },
  
  
  floor: (value: number): number => {
    return math.number(math.floor(math.bignumber(value)));
  },
  
  
  mod: (a: number, b: number): number => {
    return math.number(math.mod(math.bignumber(a), math.bignumber(b)));
  },
  
  
  min: (a: number, b: number): number => {
    return math.number(math.min(math.bignumber(a), math.bignumber(b)));
  },
  
  
  max: (a: number, b: number): number => {
    return math.number(math.max(math.bignumber(a), math.bignumber(b)));
  }
} as const;


export const INCH_TO_MM = 25.4;