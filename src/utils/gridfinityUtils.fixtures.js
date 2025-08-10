/**
 * Test fixtures with pre-computed expected outputs for various drawer configurations
 * These are known-good solutions that should not change unless the algorithm is intentionally modified
 */

export const testFixtures = {
  // Standard US drawer - 22.5" x 16.5" with Bambu Lab A1 (256x256x256mm)
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
        width: 571.5,  // mm
        height: 419.1, // mm
      },
    },
  },

  // Small drawer - 5" x 5" with Prusa Mini (180x180x180mm)
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

  // Metric drawer - 400mm x 300mm with Ender 3 (220x220x250mm)
  metricDrawer: {
    input: {
      drawerSize: { width: 400 / 25.4, height: 300 / 25.4 }, // Convert to inches
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
        // Actual implementation produces these spacers
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

  // Exact grid multiple - 10 grids x 10 grids (420mm x 420mm)
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
      spacers: {}, // No spacers for exact multiples after fix
      layoutCount: 4,
      totalCoverage: {
        width: 420,
        height: 420,
      },
    },
  },

  // Large drawer requiring split - 15" x 15" with small printer (150x150x150mm)
  largeSplitRequired: {
    input: {
      drawerSize: { width: 15, height: 15 },
      printerSize: { x: 150, y: 150, z: 150 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {
        '3x3': 9, // Maximum that fits in 150x150mm printer
      },
      spacers: {
        // Actual implementation produces these spacers
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

  // Half-size bins enabled - 6" x 4" 
  withHalfSizeBins: {
    input: {
      drawerSize: { width: 6, height: 4 },
      printerSize: { x: 200, y: 200, z: 200 },
      useHalfSize: true,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {}, // No full-size baseplates when using only half-size
      spacers: {
        // Now includes spacers for remainder space after half-size bins
        // 6" = 152.4mm, 152.4mm / 21mm = 7.25... -> 7 bins + remainder
        // 4" = 101.6mm, 101.6mm / 21mm = 4.83... -> 4 bins + remainder  
        '5.40mm x 84.00mm': 1,  // Horizontal remainder
        '147.00mm x 17.60mm': 1, // Vertical remainder
        '5.40mm x 17.60mm': 1,  // Corner remainder
      },
      halfSizeBins: {
        '7x4': 1, // Single combined half-size bin grid
      },
      layoutCount: 4, // 1 half-size bin + 3 spacers
      hasHalfSizeBins: true,
    },
  },

  // Prefer half-size for spacers - 5" x 5"
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
        // Actual implementation produces these after half-size fills
        '0.84mm x 126.00mm': 1,
        '0.84mm x 0.84mm': 1,
        '126.00mm x 0.84mm': 1,
        '0.84mm x 127.00mm': 1,
      },
      halfSizeBins: {
        // No half-size bins in this case
      },
      hasHalfSizeBins: false,
    },
  },

  // Tiny drawer - smaller than one grid (30mm x 30mm)
  tinyDrawer: {
    input: {
      drawerSize: { width: 30 / 25.4, height: 30 / 25.4 },
      printerSize: { x: 200, y: 200, z: 200 },
      useHalfSize: false,
      preferHalfSize: false,
    },
    expected: {
      baseplates: {}, // Too small for any baseplates
      spacers: {
        '30.00mm x 30.00mm': 1, // Single spacer covering entire area
      },
      layoutCount: 1,
      totalCoverage: {
        width: 30,
        height: 30,
      },
    },
  },

  // Edge case - drawer exactly printer size
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

  // Common IKEA drawer size - 500mm x 370mm
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
        // Actual implementation produces these spacers
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