
import type { DrawerSize, PrinterSize } from '@/types/gridfinity';

interface TestInput {
  drawerSize: DrawerSize;
  printerSize: PrinterSize;
  useHalfSize: boolean;
  preferHalfSize: boolean;
}

interface TestExpected {
  baseplates: Record<string, number>;
  spacers: Record<string, number>;
  layoutCount: number;
  totalCoverage?: {
    width: number;
    height: number;
  };
  halfSizeBins?: Record<string, number>;
  hasHalfSizeBins?: boolean;
}

interface TestFixture {
  input: TestInput;
  expected: TestExpected;
}

export const testFixtures: Record<string, TestFixture> = {
  standardUSDrawer: {
    input: {
      drawerSize: { width: 22.5, height: 16.5 },
      printerSize: { x: 256, y: 256, z: 256 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '6x6': 2,
        '1x6': 1,
        '6x3': 2,
        '1x3': 1,
      },
      spacers: {
        '25.62mm x 252.00mm': 1,
        '25.62mm x 126.00mm': 1,
        '252.00mm x 41.16mm': 2,
        '42.00mm x 41.16mm': 1,
        '25.62mm x 41.16mm': 1,
      },
      layoutCount: 12,
      totalCoverage: {
        width: 571.5,
        height: 419.1,
      },
    },
  },

  smallDrawer: {
    input: {
      drawerSize: { width: 5, height: 5 },
      printerSize: { x: 180, y: 180, z: 180 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '3x3': 1,
      },
      spacers: {
        '0.84mm x 126.00mm': 1,
        '126.00mm x 0.84mm': 1,
        '0.84mm x 0.84mm': 1,
      },
      layoutCount: 4,
      totalCoverage: {
        width: 127,
        height: 127,
      },
    },
  },

  metricDrawer: {
    input: {
      drawerSize: { width: 400 / 25.4, height: 300 / 25.4 },
      printerSize: { x: 220, y: 220, z: 250 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '5x5': 1,
        '4x5': 1,
        '5x2': 1,
        '4x2': 1,
      },
      spacers: {
        '22.00mm x 210.00mm': 1,
        '22.00mm x 84.00mm': 1,
        '210.00mm x 6.00mm': 1,
        '168.00mm x 6.00mm': 1,
        '22.00mm x 6.00mm': 1,
      },
      layoutCount: 9,
      totalCoverage: {
        width: 400,
        height: 300,
      },
    },
  },

  exactGridMultiple: {
    input: {
      drawerSize: { width: 420 / 25.4, height: 420 / 25.4 },
      printerSize: { x: 256, y: 256, z: 256 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '6x6': 1,
        '4x6': 1,
        '6x4': 1,
        '4x4': 1,
      },
      spacers: {},
      layoutCount: 4,
      totalCoverage: {
        width: 420,
        height: 420,
      },
    },
  },

  largeSplitRequired: {
    input: {
      drawerSize: { width: 15, height: 15 },
      printerSize: { x: 150, y: 150, z: 150 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '3x3': 9,
      },
      spacers: {
        '3.00mm x 126.00mm': 3,
        '126.00mm x 3.00mm': 3,
        '3.00mm x 3.00mm': 1,
      },
      layoutCount: 16,
      totalCoverage: {
        width: 381,
        height: 381,
      },
    },
  },

  withHalfSizeBins: {
    input: {
      drawerSize: { width: 6, height: 4 },
      printerSize: { x: 200, y: 200, z: 200 },
      useHalfSize: true,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {},
      spacers: {
        '5.40mm x 84.00mm': 1,
        '147.00mm x 17.60mm': 1,
        '5.40mm x 17.60mm': 1,
      },
      halfSizeBins: {
        '7x4': 1,
      },
      layoutCount: 4,
      hasHalfSizeBins: true,
    },
  },

  preferHalfSize: {
    input: {
      drawerSize: { width: 5, height: 5 },
      printerSize: { x: 200, y: 200, z: 200 },
      useHalfSize: false,
      preferHalfSize: true,
    },
    expected: {
      baseplates: {
        '3x3': 1,
      },
      spacers: {
        '0.84mm x 126.00mm': 1,
        '0.84mm x 0.84mm': 1,
        '126.00mm x 0.84mm': 1,
        '0.84mm x 127.00mm': 1,
      },
      halfSizeBins: {
      },
      hasHalfSizeBins: false,
      layoutCount: 5,
    },
  },

  tinyDrawer: {
    input: {
      drawerSize: { width: 30 / 25.4, height: 30 / 25.4 },
      printerSize: { x: 200, y: 200, z: 200 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {},
      spacers: {
        '30.00mm x 30.00mm': 1,
      },
      layoutCount: 1,
      totalCoverage: {
        width: 30,
        height: 30,
      },
    },
  },

  exactPrinterSize: {
    input: {
      drawerSize: { width: 256 / 25.4, height: 256 / 25.4 },
      printerSize: { x: 256, y: 256, z: 256 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '6x6': 1,
      },
      spacers: {
        '256.00mm x 4.00mm': 1,
        '4.00mm x 252.00mm': 1,
        '4.00mm x 4.00mm': 1,
      },
      layoutCount: 4,
      totalCoverage: {
        width: 256,
        height: 256,
      },
    },
  },

  ikeaDrawer: {
    input: {
      drawerSize: { width: 500 / 25.4, height: 370 / 25.4 },
      printerSize: { x: 256, y: 256, z: 256 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '6x6': 1,
        '5x6': 1,
        '6x2': 1,
        '5x2': 1,
      },
      spacers: {
        '38.00mm x 252.00mm': 1,
        '38.00mm x 84.00mm': 1,
        '252.00mm x 34.00mm': 1,
        '210.00mm x 34.00mm': 1,
        '38.00mm x 34.00mm': 1,
      },
      layoutCount: 9,
      totalCoverage: {
        width: 500,
        height: 370,
      },
    },
  },
};