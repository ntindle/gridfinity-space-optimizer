import { describe, it, expect } from 'vitest';
import { 
  generateExportData, 
  generateTextSummary,
  type ExportData
} from '@/services/exportService';
import type { GridfinityResult, PrinterSize } from '@/types';

describe('exportService', () => {
  describe('generateExportData', () => {
    const defaultPrinterSize: PrinterSize = {
      x: 256,
      y: 256,
      z: 256,
    };

    it('should generate export data for baseplates', () => {
      const result: GridfinityResult = {
        baseplates: { '6x6': 2, '3x3': 1 },
        spacers: {},
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);

      expect(exportData.prints).toHaveLength(2);
      expect(exportData.prints[0].type).toBe('baseplate');
      expect(exportData.prints[0].quantity).toBe(2);
      expect(exportData.prints[1].quantity).toBe(1);
    });

    it('should multiply quantities by number of drawers', () => {
      const result: GridfinityResult = {
        baseplates: { '6x6': 2 },
        spacers: {},
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 3);

      expect(exportData.prints[0].quantity).toBe(6);
    });

    it('should calculate max stack based on printer Z height', () => {
      const result: GridfinityResult = {
        baseplates: { '6x6': 1 },
        spacers: {},
        halfSizeBins: {},
        layout: [],
      };

      // Standard Z height should allow many stacks
      const exportData = generateExportData(result, defaultPrinterSize, 1);
      expect(exportData.prints[0].maxStack).toBeGreaterThan(10);

      // Small Z height should limit stacks
      const smallPrinter: PrinterSize = { x: 256, y: 256, z: 50 };
      const smallExportData = generateExportData(result, smallPrinter, 1);
      expect(smallExportData.prints[0].maxStack).toBeLessThan(exportData.prints[0].maxStack);
    });

    it('should generate model links for baseplates', () => {
      const result: GridfinityResult = {
        baseplates: { '6x6': 1 },
        spacers: {},
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);

      expect(exportData.prints[0].modelLinks).toHaveLength(3);
      expect(exportData.prints[0].modelLinks.map(l => l.platform)).toContain('MakerWorld');
      expect(exportData.prints[0].modelLinks.map(l => l.platform)).toContain('Printables');
      expect(exportData.prints[0].modelLinks.map(l => l.platform)).toContain('Thangs');
    });

    it('should generate export data for half-size bins', () => {
      const result: GridfinityResult = {
        baseplates: {},
        spacers: {},
        halfSizeBins: { '1x1': 4, '2x2': 2 },
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);

      expect(exportData.prints).toHaveLength(2);
      expect(exportData.prints.every(p => p.type === 'half-size')).toBe(true);
    });

    it('should generate export data for spacers', () => {
      const result: GridfinityResult = {
        baseplates: {},
        spacers: { '25.62mm x 252mm': 1, '42mm x 41.16mm': 2 },
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);

      expect(exportData.prints).toHaveLength(2);
      expect(exportData.prints.every(p => p.type === 'spacer')).toBe(true);
    });

    it('should calculate recommended stacks correctly', () => {
      const result: GridfinityResult = {
        baseplates: { '6x6': 25 },
        spacers: {},
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);
      const print = exportData.prints[0];

      // With 25 items and max stack of 20, should recommend 2 stacks
      expect(print.recommendedStacks).toBe(2);
      expect(print.leftoverItems).toBe(5);
    });

    it('should calculate total print jobs', () => {
      const result: GridfinityResult = {
        baseplates: { '6x6': 2, '3x3': 1 },
        spacers: { '25.62mm x 252mm': 1 },
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);

      expect(exportData.totalPrintJobs).toBeGreaterThan(0);
    });

    it('should generate summary text', () => {
      const result: GridfinityResult = {
        baseplates: { '6x6': 2 },
        spacers: {},
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);

      expect(exportData.summary).toContain('Print');
      expect(exportData.summary).toContain('items');
    });

    it('should return empty prints array for empty result', () => {
      const result: GridfinityResult = {
        baseplates: {},
        spacers: {},
        halfSizeBins: {},
        layout: [],
      };

      const exportData = generateExportData(result, defaultPrinterSize, 1);

      expect(exportData.prints).toHaveLength(0);
      expect(exportData.totalPrintJobs).toBe(0);
    });
  });

  describe('generateTextSummary', () => {
    it('should generate readable text summary', () => {
      const exportData: ExportData = {
        prints: [
          {
            id: 'baseplate-6x6',
            type: 'baseplate',
            width: 6,
            height: 6,
            quantity: 2,
            maxStack: 20,
            recommendedStacks: 1,
            itemsPerStack: 2,
            leftoverItems: 0,
            modelLinks: [
              { platform: 'MakerWorld', url: 'https://example.com', description: 'Test' },
            ],
          },
        ],
        stackingSavingsPercent: 50,
        totalPrintJobs: 1,
        summary: 'Print 2 total items in 1 print job using stacking.',
      };

      const text = generateTextSummary(exportData);

      expect(text).toContain('Gridfinity Layout Print List');
      expect(text).toContain('Baseplate 6x6');
      expect(text).toContain('Total needed: 2');
      expect(text).toContain('Max per stack: 20');
      expect(text).toContain('MakerWorld');
    });

    it('should handle leftover items in summary', () => {
      const exportData: ExportData = {
        prints: [
          {
            id: 'baseplate-6x6',
            type: 'baseplate',
            width: 6,
            height: 6,
            quantity: 25,
            maxStack: 20,
            recommendedStacks: 2,
            itemsPerStack: 20,
            leftoverItems: 5,
            modelLinks: [],
          },
        ],
        stackingSavingsPercent: 92,
        totalPrintJobs: 2,
        summary: 'Print 25 total items in 2 print jobs using stacking.',
      };

      const text = generateTextSummary(exportData);

      expect(text).toContain('stack(s) of 20');
      expect(text).toContain('stack of 5');
    });

    it('should handle empty prints', () => {
      const exportData: ExportData = {
        prints: [],
        stackingSavingsPercent: 0,
        totalPrintJobs: 0,
        summary: 'No items to print.',
      };

      const text = generateTextSummary(exportData);

      expect(text).toContain('Gridfinity Layout Print List');
      expect(text).toContain('No items to print.');
    });
  });
});
