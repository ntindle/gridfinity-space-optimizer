import { unitMath } from '@/services/unitMath';
import type { 
  DrawerSize, 
  PrinterSize, 
  LayoutItem, 
  GridfinityResult
} from '@/types';

export const FULL_GRID_SIZE = 42; // mm
export const HALF_GRID_SIZE = 21; // mm
export const INCH_TO_MM = 25.4;

/**
 * Split a spacer into smaller pieces if it exceeds max dimensions
 */
export const splitSpacerIfNeeded = (
  spacer: LayoutItem, 
  maxWidth: number, 
  maxHeight: number
): LayoutItem[] => {
  const spacers: LayoutItem[] = [];
  const fullWidthParts = unitMath.floor(unitMath.divide(spacer.pixelWidth, maxWidth));
  const fullHeightParts = unitMath.floor(unitMath.divide(spacer.pixelHeight, maxHeight));
  const remainderWidth = unitMath.mod(spacer.pixelWidth, maxWidth);
  const remainderHeight = unitMath.mod(spacer.pixelHeight, maxHeight);

  for (let i = 0; i < fullWidthParts; i++) {
    for (let j = 0; j < fullHeightParts; j++) {
      spacers.push(
        createSpacer(spacer, unitMath.multiply(i, maxWidth), unitMath.multiply(j, maxHeight), maxWidth, maxHeight)
      );
    }
  }

  if (remainderWidth > 0) {
    for (let j = 0; j < fullHeightParts; j++) {
      spacers.push(
        createSpacer(
          spacer,
          unitMath.multiply(fullWidthParts, maxWidth),
          unitMath.multiply(j, maxHeight),
          remainderWidth,
          maxHeight
        )
      );
    }
  }

  if (remainderHeight > 0) {
    for (let i = 0; i < fullWidthParts; i++) {
      spacers.push(
        createSpacer(
          spacer,
          unitMath.multiply(i, maxWidth),
          unitMath.multiply(fullHeightParts, maxHeight),
          maxWidth,
          remainderHeight
        )
      );
    }
  }

  if (remainderWidth > 0 && remainderHeight > 0) {
    spacers.push(
      createSpacer(
        spacer,
        unitMath.multiply(fullWidthParts, maxWidth),
        unitMath.multiply(fullHeightParts, maxHeight),
        remainderWidth,
        remainderHeight
      )
    );
  }

  return spacers;
};

/**
 * Create a spacer item
 */
const createSpacer = (
  originalSpacer: LayoutItem, 
  offsetX: number, 
  offsetY: number, 
  width: number, 
  height: number
): LayoutItem => ({
  ...originalSpacer,
  pixelX: unitMath.add(originalSpacer.pixelX, offsetX),
  pixelY: unitMath.add(originalSpacer.pixelY, offsetY),
  pixelWidth: width,
  pixelHeight: height,
  width: unitMath.round(unitMath.divide(width, FULL_GRID_SIZE), 2),
  height: unitMath.round(unitMath.divide(height, FULL_GRID_SIZE), 2),
});

/**
 * Fill a spacer with half-size bins
 */
export const fillSpacerWithHalfSizeBins = (spacer: LayoutItem): {
  halfSizeBins: LayoutItem[];
  remainingSpacers: LayoutItem[];
} => {
  const halfBinsX = unitMath.floor(unitMath.divide(spacer.pixelWidth, HALF_GRID_SIZE));
  const halfBinsY = unitMath.floor(unitMath.divide(spacer.pixelHeight, HALF_GRID_SIZE));
  const remainderWidth = unitMath.mod(spacer.pixelWidth, HALF_GRID_SIZE);
  const remainderHeight = unitMath.mod(spacer.pixelHeight, HALF_GRID_SIZE);

  const halfSizeBins: LayoutItem[] = [];
  for (let x = 0; x < halfBinsX; x++) {
    for (let y = 0; y < halfBinsY; y++) {
      halfSizeBins.push(createHalfSizeBin(spacer, x, y));
    }
  }

  const remainingSpacers: LayoutItem[] = [];
  if (remainderWidth > 0) {
    remainingSpacers.push(
      createSpacer(
        spacer,
        unitMath.multiply(halfBinsX, HALF_GRID_SIZE),
        0,
        remainderWidth,
        spacer.pixelHeight
      )
    );
  }
  if (remainderHeight > 0) {
    remainingSpacers.push(
      createSpacer(
        spacer,
        0,
        unitMath.multiply(halfBinsY, HALF_GRID_SIZE),
        unitMath.multiply(halfBinsX, HALF_GRID_SIZE),
        remainderHeight
      )
    );
  }

  return { halfSizeBins, remainingSpacers };
};

/**
 * Create a half-size bin item
 */
const createHalfSizeBin = (spacer: LayoutItem, x: number, y: number): LayoutItem => ({
  x: unitMath.add(spacer.x, unitMath.divide(unitMath.multiply(x, HALF_GRID_SIZE), FULL_GRID_SIZE)),
  y: unitMath.add(spacer.y, unitMath.divide(unitMath.multiply(y, HALF_GRID_SIZE), FULL_GRID_SIZE)),
  width: 0.5,
  height: 0.5,
  type: "half-size",
  pixelX: unitMath.add(spacer.pixelX, unitMath.multiply(x, HALF_GRID_SIZE)),
  pixelY: unitMath.add(spacer.pixelY, unitMath.multiply(y, HALF_GRID_SIZE)),
  pixelWidth: HALF_GRID_SIZE,
  pixelHeight: HALF_GRID_SIZE,
});

/**
 * Combine half-size bins into larger groups
 */
export const combineHalfSizeBins = (
  halfSizeBins: LayoutItem[], 
  maxWidth: number, 
  maxHeight: number
): LayoutItem[] => {
  const sortedBins = halfSizeBins.sort(
    (a, b) => unitMath.subtract(a.pixelX, b.pixelX) || unitMath.subtract(a.pixelY, b.pixelY)
  );
  const combinedBins: LayoutItem[] = [];

  let currentBin: LayoutItem | null = null;
  for (const bin of sortedBins) {
    if (!currentBin) {
      currentBin = { ...bin, width: 0.5, height: 0.5 };
    } else if (
      currentBin.pixelX === bin.pixelX &&
      unitMath.add(currentBin.pixelY, currentBin.pixelHeight) === bin.pixelY &&
      unitMath.add(currentBin.pixelHeight, HALF_GRID_SIZE) <= maxHeight
    ) {
      currentBin.pixelHeight = unitMath.add(currentBin.pixelHeight, bin.pixelHeight);
      currentBin.height = unitMath.add(currentBin.height, 0.5);
    } else {
      combinedBins.push(currentBin);
      currentBin = { ...bin, width: 0.5, height: 0.5 };
    }
  }
  if (currentBin) {
    combinedBins.push(currentBin);
  }

  return combineBinsHorizontally(combinedBins, maxWidth);
};

/**
 * Combine bins horizontally
 */
const combineBinsHorizontally = (bins: LayoutItem[], maxWidth: number): LayoutItem[] => {
  const sortedBins = bins.sort(
    (a, b) => unitMath.subtract(a.pixelY, b.pixelY) || unitMath.subtract(a.pixelX, b.pixelX)
  );
  const finalBins: LayoutItem[] = [];

  let currentRow: LayoutItem[] = [];
  let currentY: number | null = null;

  for (const bin of sortedBins) {
    if (currentY === null || bin.pixelY !== currentY) {
      if (currentRow.length > 0) {
        finalBins.push(...combineRow(currentRow, maxWidth));
      }
      currentRow = [bin];
      currentY = bin.pixelY;
    } else {
      currentRow.push(bin);
    }
  }

  if (currentRow.length > 0) {
    finalBins.push(...combineRow(currentRow, maxWidth));
  }

  return finalBins;
};

/**
 * Combine bins in a single row
 */
const combineRow = (row: LayoutItem[], maxWidth: number): LayoutItem[] => {
  const combinedRow: LayoutItem[] = [];
  let currentBin: LayoutItem | null = null;

  for (const bin of row) {
    if (!currentBin) {
      currentBin = { ...bin };
    } else if (
      unitMath.add(currentBin.pixelX, currentBin.pixelWidth) === bin.pixelX &&
      currentBin.height === bin.height &&
      unitMath.add(currentBin.pixelWidth, bin.pixelWidth) <= maxWidth
    ) {
      currentBin.pixelWidth = unitMath.add(currentBin.pixelWidth, bin.pixelWidth);
      currentBin.width = unitMath.add(currentBin.width, bin.width);
    } else {
      combinedRow.push(currentBin);
      currentBin = { ...bin };
    }
  }

  if (currentBin) {
    combinedRow.push(currentBin);
  }

  return combinedRow;
};

/**
 * Get color for visualization
 */
export const getColor = (type: LayoutItem['type'], index: number): string => {
  if (type === "spacer") return "rgba(255, 0, 0, 0.3)";
  if (type === "half-size") return "rgba(0, 255, 0, 0.3)";
  const hue = unitMath.mod(unitMath.multiply(index, 137.5), 360);
  return `hsl(${hue}, 70%, 80%)`;
};

/**
 * Calculate uniform baseplate options for a given grid size
 */
const calculateUniformBaseplates = (
  gridCountX: number,
  gridCountY: number,
  maxGridX: number,
  maxGridY: number
): { width: number; height: number; count: number; coverage: number } | null => {
  const candidates: { width: number; height: number; count: number; coverage: number }[] = [];
  
  // Try all possible uniform sizes that fit within printer constraints
  for (let width = 1; width <= maxGridX; width++) {
    for (let height = 1; height <= maxGridY; height++) {
      // Calculate how many baseplates we can fit
      const countX = unitMath.floor(unitMath.divide(gridCountX, width));
      const countY = unitMath.floor(unitMath.divide(gridCountY, height));
      const totalCount = unitMath.multiply(countX, countY);
      
      // Calculate coverage percentage
      const coveredX = unitMath.multiply(countX, width);
      const coveredY = unitMath.multiply(countY, height);
      const totalArea = unitMath.multiply(gridCountX, gridCountY);
      const coveredArea = unitMath.multiply(coveredX, coveredY);
      const coverage = unitMath.divide(coveredArea, totalArea);
      
      // Only consider options that cover at least 90% of the area
      if (coverage >= 0.9 && totalCount > 0) {
        candidates.push({
          width,
          height,
          count: totalCount,
          coverage: coverage
        });
      }
    }
  }
  
  // Sort by coverage (descending) then by count (ascending for fewer pieces)
  candidates.sort((a, b) => {
    const coverageDiff = unitMath.subtract(b.coverage, a.coverage);
    if (unitMath.approxEqual(coverageDiff, 0, 0.001)) {
      return unitMath.subtract(a.count, b.count);
    }
    return coverageDiff;
  });
  
  return candidates.length > 0 ? candidates[0] : null;
};

/**
 * Main calculation function
 */
export const calculateGrids = (
  drawerSize: DrawerSize,
  printerSize: PrinterSize,
  useHalfSize: boolean,
  preferHalfSize: boolean,
  preferUniformBaseplates: boolean = false
): GridfinityResult => {
  // Handle invalid drawer dimensions
  if (!drawerSize || drawerSize.width <= 0 || drawerSize.height <= 0) {
    return {
      baseplates: {},
      spacers: {},
      halfSizeBins: {},
      layout: [],
    };
  }

  const drawerWidth = unitMath.convert(drawerSize.width, 'inch', 'mm');
  const drawerHeight = unitMath.convert(drawerSize.height, 'inch', 'mm');

  const gridSize = useHalfSize ? HALF_GRID_SIZE : FULL_GRID_SIZE;
  const gridCountX = unitMath.floor(unitMath.divide(drawerWidth, gridSize));
  const gridCountY = unitMath.floor(unitMath.divide(drawerHeight, gridSize));

  // Calculate effective printer size accounting for exclusion zones
  let effectiveX = printerSize.x;
  let effectiveY = printerSize.y;
  
  if (printerSize.exclusionZone) {
    const { left = 0, right = 0, front = 0, back = 0 } = printerSize.exclusionZone;
    effectiveX = unitMath.subtract(effectiveX, unitMath.add(left, right));
    effectiveY = unitMath.subtract(effectiveY, unitMath.add(front, back));
  }

  const maxPrintSizeX = unitMath.multiply(unitMath.floor(unitMath.divide(effectiveX, gridSize)), gridSize);
  const maxPrintSizeY = unitMath.multiply(unitMath.floor(unitMath.divide(effectiveY, gridSize)), gridSize);

  const baseplates: string[] = [];
  let newLayout: LayoutItem[] = [];
  const remainingWidth = unitMath.subtract(drawerWidth, unitMath.multiply(gridCountX, gridSize));
  const remainingHeight = unitMath.subtract(drawerHeight, unitMath.multiply(gridCountY, gridSize));

  // Try uniform baseplates if preferred and not using half-size
  if (preferUniformBaseplates && !useHalfSize) {
    const maxGridX = unitMath.divide(maxPrintSizeX, gridSize);
    const maxGridY = unitMath.divide(maxPrintSizeY, gridSize);
    const uniformOption = calculateUniformBaseplates(gridCountX, gridCountY, maxGridX, maxGridY);
    
    if (uniformOption && uniformOption.coverage >= 0.9) {
      // Use uniform baseplates
      const { width, height } = uniformOption;
      for (let y = 0; y < gridCountY; y += height) {
        for (let x = 0; x < gridCountX; x += width) {
          // Make sure we don't exceed the drawer bounds
          if (x + width <= gridCountX && y + height <= gridCountY) {
            const item: LayoutItem = {
              x,
              y,
              width,
              height,
              type: "baseplate",
              pixelX: unitMath.multiply(x, gridSize),
              pixelY: unitMath.multiply(y, gridSize),
              pixelWidth: unitMath.multiply(width, gridSize),
              pixelHeight: unitMath.multiply(height, gridSize),
            };
            baseplates.push(`${width}x${height}`);
            newLayout.push(item);
          }
        }
      }
      
      // Add any remaining uncovered areas as smaller baseplates
      const coveredX = unitMath.multiply(
        unitMath.floor(unitMath.divide(gridCountX, width)),
        width
      );
      const coveredY = unitMath.multiply(
        unitMath.floor(unitMath.divide(gridCountY, height)),
        height
      );
      
      // Right edge remainder
      if (coveredX < gridCountX) {
        for (let y = 0; y < coveredY; y += maxGridY) {
          const remainingWidth = unitMath.subtract(gridCountX, coveredX);
          const pieceHeight = unitMath.min(maxGridY, unitMath.subtract(coveredY, y));
          const item: LayoutItem = {
            x: coveredX,
            y,
            width: remainingWidth,
            height: pieceHeight,
            type: "baseplate",
            pixelX: unitMath.multiply(coveredX, gridSize),
            pixelY: unitMath.multiply(y, gridSize),
            pixelWidth: unitMath.multiply(remainingWidth, gridSize),
            pixelHeight: unitMath.multiply(pieceHeight, gridSize),
          };
          baseplates.push(`${remainingWidth}x${pieceHeight}`);
          newLayout.push(item);
        }
      }
      
      // Bottom edge remainder
      if (coveredY < gridCountY) {
        for (let x = 0; x < coveredX; x += maxGridX) {
          const remainingHeight = unitMath.subtract(gridCountY, coveredY);
          const pieceWidth = unitMath.min(maxGridX, unitMath.subtract(coveredX, x));
          const item: LayoutItem = {
            x,
            y: coveredY,
            width: pieceWidth,
            height: remainingHeight,
            type: "baseplate",
            pixelX: unitMath.multiply(x, gridSize),
            pixelY: unitMath.multiply(coveredY, gridSize),
            pixelWidth: unitMath.multiply(pieceWidth, gridSize),
            pixelHeight: unitMath.multiply(remainingHeight, gridSize),
          };
          baseplates.push(`${pieceWidth}x${remainingHeight}`);
          newLayout.push(item);
        }
      }
      
      // Corner remainder
      if (coveredX < gridCountX && coveredY < gridCountY) {
        const remainingWidthCorner = unitMath.subtract(gridCountX, coveredX);
        const remainingHeightCorner = unitMath.subtract(gridCountY, coveredY);
        const item: LayoutItem = {
          x: coveredX,
          y: coveredY,
          width: remainingWidthCorner,
          height: remainingHeightCorner,
          type: "baseplate",
          pixelX: unitMath.multiply(coveredX, gridSize),
          pixelY: unitMath.multiply(coveredY, gridSize),
          pixelWidth: unitMath.multiply(remainingWidthCorner, gridSize),
          pixelHeight: unitMath.multiply(remainingHeightCorner, gridSize),
        };
        baseplates.push(`${remainingWidthCorner}x${remainingHeightCorner}`);
        newLayout.push(item);
      }
    } else {
      // Fall back to regular algorithm
      preferUniformBaseplates = false;
    }
  }
  
  // Use regular algorithm if not using uniform baseplates
  if (!preferUniformBaseplates || useHalfSize) {
    for (let y = 0; y < gridCountY; y += unitMath.divide(maxPrintSizeY, gridSize)) {
      for (let x = 0; x < gridCountX; x += unitMath.divide(maxPrintSizeX, gridSize)) {
        const width = unitMath.min(unitMath.divide(maxPrintSizeX, gridSize), unitMath.subtract(gridCountX, x));
        const height = unitMath.min(unitMath.divide(maxPrintSizeY, gridSize), unitMath.subtract(gridCountY, y));
        const item: LayoutItem = {
          x,
          y,
          width,
          height,
          type: useHalfSize ? "half-size" : "baseplate",
          pixelX: unitMath.multiply(x, gridSize),
          pixelY: unitMath.multiply(y, gridSize),
          pixelWidth: unitMath.multiply(width, gridSize),
          pixelHeight: unitMath.multiply(height, gridSize),
        };
        if (useHalfSize) {
          newLayout.push(item);
        } else {
          baseplates.push(`${width}x${height}`);
          newLayout.push(item);
        }
      }
    }
  }

  let spacers: LayoutItem[] = [];

  // Add horizontal spacer if needed (only if there's actual remaining width)
  if (!unitMath.approxEqual(remainingWidth, 0, 0.01)) {
    spacers = spacers.concat(
      splitSpacerIfNeeded(
        {
          x: gridCountX,
          y: 0,
          width: unitMath.divide(remainingWidth, gridSize),
          height: gridCountY,
          type: "spacer",
          pixelX: unitMath.multiply(gridCountX, gridSize),
          pixelY: 0,
          pixelWidth: remainingWidth,
          pixelHeight: unitMath.multiply(gridCountY, gridSize),
        },
        maxPrintSizeX,
        maxPrintSizeY
      )
    );
  }

  // Add vertical spacer if needed (only if there's actual remaining height)
  if (!unitMath.approxEqual(remainingHeight, 0, 0.01)) {
    spacers = spacers.concat(
      splitSpacerIfNeeded(
        {
          x: 0,
          y: gridCountY,
          width: gridCountX,
          height: unitMath.divide(remainingHeight, gridSize),
          type: "spacer",
          pixelX: 0,
          pixelY: unitMath.multiply(gridCountY, gridSize),
          pixelWidth: unitMath.multiply(gridCountX, gridSize),
          pixelHeight: remainingHeight,
        },
        maxPrintSizeX,
        maxPrintSizeY
      )
    );
  }

  // Add corner spacer if needed (only if both dimensions have remainders)
  if (!unitMath.approxEqual(remainingWidth, 0, 0.01) && !unitMath.approxEqual(remainingHeight, 0, 0.01)) {
    spacers = spacers.concat(
      splitSpacerIfNeeded(
        {
          x: gridCountX,
          y: gridCountY,
          width: unitMath.divide(remainingWidth, gridSize),
          height: unitMath.divide(remainingHeight, gridSize),
          type: "spacer",
          pixelX: unitMath.multiply(gridCountX, gridSize),
          pixelY: unitMath.multiply(gridCountY, gridSize),
          pixelWidth: remainingWidth,
          pixelHeight: remainingHeight,
        },
        maxPrintSizeX,
        maxPrintSizeY
      )
    );
  }

  let halfSizeBins: LayoutItem[] = [];
  let updatedSpacers: LayoutItem[] = [];
  if (preferHalfSize && !useHalfSize) {
    spacers.forEach((spacer) => {
      const { halfSizeBins: bins, remainingSpacers } =
        fillSpacerWithHalfSizeBins(spacer);
      halfSizeBins = halfSizeBins.concat(bins);
      updatedSpacers = updatedSpacers.concat(remainingSpacers);
    });

    // Combine half-size bins into grids, constrained by max print size
    const combinedHalfSizeBins = combineHalfSizeBins(
      halfSizeBins,
      maxPrintSizeX,
      maxPrintSizeY
    );

    // Only replace spacers with half-size bins
    newLayout = newLayout.concat(combinedHalfSizeBins, updatedSpacers);
  } else {
    // Add spacers for both regular baseplates AND half-size bins
    newLayout = newLayout.concat(spacers);
  }

  const counts = baseplates.reduce<Record<string, number>>((acc, plate) => {
    acc[plate] = unitMath.add(acc[plate] || 0, 1);
    return acc;
  }, {});

  const spacerCounts = newLayout
    .filter((item) => item.type === "spacer")
    .reduce<Record<string, number>>((acc, spacer) => {
      const key = `${unitMath.round(unitMath.multiply(spacer.width, gridSize), 2)}mm x ${unitMath.round(
        unitMath.multiply(spacer.height, gridSize), 2
      )}mm`;
      acc[key] = unitMath.add(acc[key] || 0, 1);
      return acc;
    }, {});

  const halfSizeBinCounts = newLayout
    .filter((item) => item.type === "half-size")
    .reduce<Record<string, number>>((acc, bin) => {
      const key = `${bin.width}x${bin.height}`;
      acc[key] = unitMath.add(acc[key] || 0, 1);
      return acc;
    }, {});

  return {
    baseplates: counts,
    spacers: spacerCounts,
    halfSizeBins: halfSizeBinCounts,
    layout: newLayout,
  };
};