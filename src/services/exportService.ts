/**
 * Export Service for Gridfinity Space Optimizer
 * 
 * Provides functionality for generating stackable print information
 * and links to Gridfinity model repositories.
 */

import type { PrinterSize, GridfinityResult } from '@/types';
import { unitMath } from '@/services/unitMath';
import { FULL_GRID_SIZE } from '@/utils/gridfinityUtils';

/**
 * Information about a stackable print
 */
export interface StackablePrint {
  /** Unique identifier for this print type (e.g., "6x6 baseplate") */
  id: string;
  /** Type of item */
  type: 'baseplate' | 'half-size' | 'spacer';
  /** Width in grid units */
  width: number;
  /** Height in grid units */
  height: number;
  /** Total quantity needed */
  quantity: number;
  /** Maximum number that can be stacked based on printer Z height */
  maxStack: number;
  /** Recommended number of stacks to print */
  recommendedStacks: number;
  /** Items per recommended stack */
  itemsPerStack: number;
  /** Leftover items after full stacks */
  leftoverItems: number;
  /** Links to model repositories */
  modelLinks: ModelLink[];
}

/**
 * Link to a model on a repository
 */
export interface ModelLink {
  /** Platform name */
  platform: 'MakerWorld' | 'Printables' | 'Thingiverse' | 'Thangs';
  /** URL to the model */
  url: string;
  /** Description of the model */
  description: string;
}

/**
 * Export data for the entire layout
 */
export interface ExportData {
  /** All stackable prints organized by type */
  prints: StackablePrint[];
  /** Total print time savings estimate (percentage) */
  stackingSavingsPercent: number;
  /** Number of separate print jobs required */
  totalPrintJobs: number;
  /** Summary text */
  summary: string;
}

/**
 * Estimated height of different Gridfinity components in mm
 * These are approximate heights for standard Gridfinity items
 */
const COMPONENT_HEIGHTS: Record<string, number> = {
  baseplate: 5.4, // Standard baseplate height
  'half-size': 5.4, // Half-size bin baseplate height
  spacer: 3.0, // Spacer is typically thinner
};

/**
 * Regex pattern for parsing spacer size strings like "25.62mm x 252mm"
 */
const SPACER_SIZE_PATTERN = /^([\d.]+)mm x ([\d.]+)mm$/;

/**
 * Calculate the optimal items per stack based on quantity and max stack
 * @param totalQuantity Total items needed
 * @param maxStack Maximum items that can be stacked
 * @param leftoverItems Items remaining after full stacks
 * @param recommendedStacks Total number of stacks needed
 * @returns The number of items to put in each full stack
 */
const calculateItemsPerStack = (
  totalQuantity: number,
  maxStack: number,
  leftoverItems: number,
  recommendedStacks: number
): number => {
  const baseItemsPerStack = unitMath.min(maxStack, totalQuantity);
  // If there are leftover items and multiple stacks, use max for full stacks
  return leftoverItems > 0 && recommendedStacks > 1 ? maxStack : baseItemsPerStack;
};

/**
 * Calculate stacking metrics for a given quantity and max stack size
 */
const calculateStackingMetrics = (
  totalQuantity: number,
  maxStack: number
): { recommendedStacks: number; itemsPerStack: number; leftoverItems: number } => {
  const recommendedStacks = Math.ceil(unitMath.divide(totalQuantity, maxStack));
  const leftoverItems = unitMath.mod(totalQuantity, maxStack);
  const itemsPerStack = calculateItemsPerStack(totalQuantity, maxStack, leftoverItems, recommendedStacks);
  
  return { recommendedStacks, itemsPerStack, leftoverItems };
};

/**
 * Generate model repository links for a given baseplate size
 */
const generateModelLinks = (
  type: 'baseplate' | 'half-size' | 'spacer',
  width: number,
  height: number
): ModelLink[] => {
  const links: ModelLink[] = [];
  
  if (type === 'baseplate') {
    // Standard Gridfinity baseplates - link to common repositories
    links.push({
      platform: 'MakerWorld',
      url: `https://makerworld.com/en/search/models?keyword=gridfinity%20baseplate%20${width}x${height}`,
      description: `Search for ${width}x${height} Gridfinity baseplate on MakerWorld`,
    });
    links.push({
      platform: 'Printables',
      url: `https://www.printables.com/search/models?q=gridfinity%20baseplate%20${width}x${height}`,
      description: `Search for ${width}x${height} Gridfinity baseplate on Printables`,
    });
    links.push({
      platform: 'Thangs',
      url: `https://thangs.com/search/gridfinity%20baseplate%20${width}x${height}`,
      description: `Search for ${width}x${height} Gridfinity baseplate on Thangs`,
    });
  } else if (type === 'half-size') {
    // Half-size Gridfinity bins
    links.push({
      platform: 'MakerWorld',
      url: `https://makerworld.com/en/search/models?keyword=gridfinity%20half%20size%20${width}x${height}`,
      description: `Search for ${width}x${height} half-size Gridfinity bins on MakerWorld`,
    });
    links.push({
      platform: 'Printables',
      url: `https://www.printables.com/search/models?q=gridfinity%20half%20size%20${width}x${height}`,
      description: `Search for ${width}x${height} half-size Gridfinity bins on Printables`,
    });
  } else {
    // Spacers - these are typically custom, so provide general search
    links.push({
      platform: 'Printables',
      url: 'https://www.printables.com/search/models?q=gridfinity%20spacer',
      description: 'Search for Gridfinity spacers on Printables',
    });
  }

  return links;
};

/**
 * Calculate the maximum number of items that can be stacked
 * based on printer Z height and component height
 */
const calculateMaxStack = (
  printerZ: number,
  componentType: 'baseplate' | 'half-size' | 'spacer'
): number => {
  const itemHeight = COMPONENT_HEIGHTS[componentType] || 5.4;
  
  // Leave some margin for adhesion and safety (5mm)
  const usableZ = unitMath.subtract(printerZ, 5);
  
  // Calculate max items that fit by height
  const maxByHeight = unitMath.floor(unitMath.divide(usableZ, itemHeight));
  
  // Practical limit - don't stack too many to avoid print failures
  const practicalLimit = 20;
  
  return Math.min(maxByHeight, practicalLimit);
};

/**
 * Generate export data for stackable prints
 */
export const generateExportData = (
  result: GridfinityResult,
  printerSize: PrinterSize,
  numDrawers: number
): ExportData => {
  const prints: StackablePrint[] = [];
  
  // Process baseplates
  Object.entries(result.baseplates).forEach(([size, count]) => {
    const [widthStr, heightStr] = size.split('x');
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);
    const totalQuantity = unitMath.multiply(count, numDrawers);
    
    const maxStack = calculateMaxStack(printerSize.z, 'baseplate');
    const metrics = calculateStackingMetrics(totalQuantity, maxStack);
    
    prints.push({
      id: `baseplate-${size}`,
      type: 'baseplate',
      width,
      height,
      quantity: totalQuantity,
      maxStack,
      ...metrics,
      modelLinks: generateModelLinks('baseplate', width, height),
    });
  });
  
  // Process half-size bins
  Object.entries(result.halfSizeBins).forEach(([size, count]) => {
    const [widthStr, heightStr] = size.split('x');
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);
    const totalQuantity = unitMath.multiply(count, numDrawers);
    
    const maxStack = calculateMaxStack(printerSize.z, 'half-size');
    const metrics = calculateStackingMetrics(totalQuantity, maxStack);
    
    prints.push({
      id: `half-size-${size}`,
      type: 'half-size',
      width,
      height,
      quantity: totalQuantity,
      maxStack,
      ...metrics,
      modelLinks: generateModelLinks('half-size', width, height),
    });
  });
  
  // Process spacers
  Object.entries(result.spacers).forEach(([size, count]) => {
    // Parse size using the documented pattern (e.g., "25.62mm x 252mm")
    const match = size.match(SPACER_SIZE_PATTERN);
    if (!match) return;
    
    const widthMm = parseFloat(match[1]);
    const heightMm = parseFloat(match[2]);
    const totalQuantity = unitMath.multiply(count, numDrawers);
    
    const maxStack = calculateMaxStack(printerSize.z, 'spacer');
    const metrics = calculateStackingMetrics(totalQuantity, maxStack);
    
    prints.push({
      id: `spacer-${size}`,
      type: 'spacer',
      width: unitMath.round(unitMath.divide(widthMm, FULL_GRID_SIZE), 2),
      height: unitMath.round(unitMath.divide(heightMm, FULL_GRID_SIZE), 2),
      quantity: totalQuantity,
      maxStack,
      ...metrics,
      modelLinks: generateModelLinks('spacer', widthMm, heightMm),
    });
  });
  
  // Calculate total print jobs and stacking savings
  const totalItems = prints.reduce((acc, p) => unitMath.add(acc, p.quantity), 0);
  const totalPrintJobs = prints.reduce((acc, p) => unitMath.add(acc, p.recommendedStacks), 0);
  
  // Estimate savings: if we print items individually vs stacked
  // Stacking saves on bed adhesion/first layer time and reduces job management
  const stackingSavingsPercent = totalItems > 0 
    ? unitMath.round(unitMath.multiply(unitMath.divide(unitMath.subtract(totalItems, totalPrintJobs), totalItems), 100), 1)
    : 0;
  
  const summary = generateSummary(prints, totalPrintJobs, stackingSavingsPercent);
  
  return {
    prints,
    stackingSavingsPercent,
    totalPrintJobs,
    summary,
  };
};

/**
 * Generate a human-readable summary of the export data
 */
const generateSummary = (
  prints: StackablePrint[],
  totalPrintJobs: number,
  savingsPercent: number
): string => {
  if (prints.length === 0) {
    return 'No items to print.';
  }
  
  const totalItems = prints.reduce((acc, p) => unitMath.add(acc, p.quantity), 0);
  
  let summary = `Print ${totalItems} total items in ${totalPrintJobs} print job${totalPrintJobs !== 1 ? 's' : ''} using stacking. `;
  
  if (savingsPercent > 0) {
    summary += `This saves approximately ${savingsPercent}% compared to printing each item individually.`;
  }
  
  return summary;
};

/**
 * Generate a shareable text summary of the print list
 */
export const generateTextSummary = (exportData: ExportData): string => {
  const lines: string[] = [
    '=== Gridfinity Layout Print List ===',
    '',
    exportData.summary,
    '',
    '--- Print Jobs (Stacked) ---',
    '',
  ];
  
  exportData.prints.forEach((print) => {
    const typeLabel = print.type === 'baseplate' ? 'Baseplate' 
      : print.type === 'half-size' ? 'Half-size Bin' 
      : 'Spacer';
    
    lines.push(`${typeLabel} ${print.width}x${print.height}:`);
    lines.push(`  Total needed: ${print.quantity}`);
    lines.push(`  Max per stack: ${print.maxStack}`);
    
    if (print.leftoverItems > 0 && print.recommendedStacks > 1) {
      lines.push(`  Print ${print.recommendedStacks - 1} stack(s) of ${print.itemsPerStack}, then 1 stack of ${print.leftoverItems}`);
    } else {
      lines.push(`  Print ${print.recommendedStacks} stack(s) of ${print.itemsPerStack}`);
    }
    
    if (print.modelLinks.length > 0) {
      lines.push('  Find models at:');
      print.modelLinks.forEach((link) => {
        lines.push(`    - ${link.platform}: ${link.url}`);
      });
    }
    lines.push('');
  });
  
  lines.push('=== End of Print List ===');
  
  return lines.join('\n');
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};
