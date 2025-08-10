import { calculateGrids } from './gridfinityUtils.js';

// Helper to capture actual outputs for test fixtures
const captureOutput = (name, input) => {
  const result = calculateGrids(
    input.drawerSize,
    input.printerSize,
    input.useHalfSize,
    input.preferHalfSize
  );
  
  console.log(`\n=== ${name} ===`);
  console.log('Baseplates:', JSON.stringify(result.baseplates, null, 2));
  console.log('Spacers:', JSON.stringify(result.spacers, null, 2));
  console.log('HalfSizeBins:', JSON.stringify(result.halfSizeBins, null, 2));
  console.log('Layout count:', result.layout.length);
  
  // Calculate coverage
  let maxX = 0;
  let maxY = 0;
  result.layout.forEach(item => {
    maxX = Math.max(maxX, item.pixelX + item.pixelWidth);
    maxY = Math.max(maxY, item.pixelY + item.pixelHeight);
  });
  console.log('Coverage:', { width: maxX, height: maxY });
};

// Standard US drawer
captureOutput('Standard US Drawer', {
  drawerSize: { width: 22.5, height: 16.5 },
  printerSize: { x: 256, y: 256, z: 256 },
  useHalfSize: false,
  preferHalfSize: false,
});

// Small drawer
captureOutput('Small Drawer', {
  drawerSize: { width: 5, height: 5 },
  printerSize: { x: 180, y: 180, z: 180 },
  useHalfSize: false,
  preferHalfSize: false,
});

// Exact grid multiple
captureOutput('Exact Grid Multiple', {
  drawerSize: { width: 420 / 25.4, height: 420 / 25.4 },
  printerSize: { x: 256, y: 256, z: 256 },
  useHalfSize: false,
  preferHalfSize: false,
});

// With half-size bins
captureOutput('With Half-Size Bins', {
  drawerSize: { width: 6, height: 4 },
  printerSize: { x: 200, y: 200, z: 200 },
  useHalfSize: true,
  preferHalfSize: false,
});