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

// Scoring algorithm constants
/**
 * Penalty applied for each additional piece required in the layout.
 * Higher values discourage solutions with more pieces.
 */
const PIECE_COUNT_PENALTY = 10;
/**
 * Penalty applied for each unique piece type (variety) in the layout.
 * Higher values discourage solutions with more different types of pieces.
 */
const VARIETY_PENALTY = 20;
/**
 * Penalty applied for each small piece in the layout.
 * Higher values discourage solutions with more small pieces.
 */
const SMALL_PIECE_PENALTY = 5;
/**
 * Minimum ratio of piece size to grid size considered desirable.
 * Pieces smaller than this ratio may be penalized.
 */
const MIN_DESIRABLE_SIZE_RATIO = 0.4;
/**
 * Preferred round sizes for pieces (in grid units).
 * Solutions using these sizes may receive a bonus.
 */
const PREFERRED_ROUND_SIZES = [3, 4, 5];
/**
 * Bonus applied when a preferred round size is used.
 * Higher values encourage use of preferred sizes.
 */
const ROUND_SIZE_BONUS = 2;
/**
 * Penalty applied for each unique baseplate type in the layout.
 * Higher values discourage solutions with more different baseplate types.
 */
const BASEPLATE_VARIETY_PENALTY = 15;

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
 * Find all ways to divide a length into pieces no larger than maxSize
 * Returns array of piece sizes that sum to length
 */
const findDivisions = (length: number, maxSize: number, minSize: number = 2): number[][] => {
  const divisions: number[][] = [];
  
  // Try each possible base size from maxSize down to minSize
  for (let baseSize = maxSize; baseSize >= minSize; baseSize--) {
    const fullPieces = unitMath.floor(unitMath.divide(length, baseSize));
    const remainder = unitMath.mod(length, baseSize);
    
    if (fullPieces === 0) continue;
    
    if (remainder === 0) {
      // Perfect division
      divisions.push(Array(fullPieces).fill(baseSize));
    } else if (remainder >= minSize) {
      // Division with acceptable remainder
      divisions.push([...Array(fullPieces).fill(baseSize), remainder]);
    } else if (fullPieces > 1) {
      // Try redistributing to avoid tiny remainder
      // e.g., instead of 6+6+1, try 5+5+3 or 4+4+5
      const adjusted = baseSize - 1;
      if (adjusted >= minSize) {
        const newRemainder = length - (fullPieces - 1) * adjusted;
        if (newRemainder <= maxSize && newRemainder >= minSize) {
          divisions.push([...Array(fullPieces - 1).fill(adjusted), newRemainder]);
        }
      }
    }
  }
  
  return divisions;
};

/**
 * Score a division based on desirability
 * Lower score is better
 */
const scoreDivision = (division: number[], maxSize: number): number => {
  let score = 0;
  
  // Penalize more pieces (prefer fewer, larger pieces)
  score += division.length * PIECE_COUNT_PENALTY;
  
  // Penalize variety (prefer uniform sizes)
  const uniqueSizes = new Set(division).size;
  score += uniqueSizes * VARIETY_PENALTY;
  
  // Penalize small pieces (prefer pieces at least 40% of max)
  const minDesirable = unitMath.multiply(maxSize, MIN_DESIRABLE_SIZE_RATIO);
  division.forEach(size => {
    if (size < minDesirable) {
      score += unitMath.multiply(unitMath.subtract(minDesirable, size), SMALL_PIECE_PENALTY);
    }
  });
  
  // Slightly prefer "round" numbers (5 over 6, etc.)
  division.forEach(size => {
    if (PREFERRED_ROUND_SIZES.includes(size)) {
      score -= ROUND_SIZE_BONUS;
    }
  });
  
  return score;
};

/**
 * Determines the optimal way to divide a grid into baseplates for uniform allocation,
 * minimizing the number and variety of baseplate types while respecting size constraints.
 *
 * This function is central to the uniform baseplate allocation strategy: it exhaustively
 * searches for all possible divisions of the grid along X and Y axes, where each division
 * represents a possible way to split the grid into baseplates no larger than the specified
 * maximum sizes. Each combination of divisions is scored based on criteria such as the
 * number of pieces, uniformity, and variety of baseplate types. The layout with the lowest
 * score is selected as the optimal allocation.
 *
 * @param {number} gridCountX - The total number of grid units along the X axis to cover.
 * @param {number} gridCountY - The total number of grid units along the Y axis to cover.
 * @param {number} maxGridX - The maximum allowed baseplate size along the X axis (in grid units).
 * @param {number} maxGridY - The maximum allowed baseplate size along the Y axis (in grid units).
 * @param {number} [minBaseplateSize=2] - The minimum allowed baseplate size (in grid units).
 * @returns {{ layout: number[][]; score: number } | null}
 *   An object containing the optimal layout (as two arrays of baseplate sizes for X and Y axes)
 *   and its score, or null if no valid division is found.
 *
 * The returned layout can be used to generate a set of baseplates that efficiently and
 * uniformly cover the specified grid area, minimizing waste and variety.
 */
const calculateSmartBaseplates = (
  gridCountX: number,
  gridCountY: number,
  maxGridX: number,
  maxGridY: number,
  minBaseplateSize: number = 2
): { layout: number[][]; score: number } | null => {
  const xDivisions = findDivisions(gridCountX, maxGridX, minBaseplateSize);
  const yDivisions = findDivisions(gridCountY, maxGridY, minBaseplateSize);
  
  if (xDivisions.length === 0 || yDivisions.length === 0) {
    return null;
  }
  
  let bestLayout: number[][] | null = null;
  let bestScore = Infinity;
  
  // Try all combinations of X and Y divisions
  for (const xDiv of xDivisions) {
    for (const yDiv of yDivisions) {
      // Calculate the score for this combination
      const xScore = scoreDivision(xDiv, maxGridX);
      const yScore = scoreDivision(yDiv, maxGridY);
      const totalScore = xScore + yScore;
      
      // Additional penalty for total number of unique baseplate types
      const baseplateTypes = new Set<string>();
      for (const x of xDiv) {
        for (const y of yDiv) {
          baseplateTypes.add(`${x}x${y}`);
        }
      }
      const varietyPenalty = unitMath.multiply(baseplateTypes.size, BASEPLATE_VARIETY_PENALTY);
      
      const finalScore = totalScore + varietyPenalty;
      
      if (finalScore < bestScore) {
        bestScore = finalScore;
        bestLayout = [xDiv, yDiv];
      }
    }
  }
  
  return bestLayout ? { layout: bestLayout, score: bestScore } : null;
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

  // Track whether we're using smart allocation
  let useSmartAllocation = false;

  // Try uniform baseplates if preferred and not using half-size
  if (preferUniformBaseplates && !useHalfSize) {
    const maxGridX = unitMath.divide(maxPrintSizeX, gridSize);
    const maxGridY = unitMath.divide(maxPrintSizeY, gridSize);
    const minBaseplateSize = 2; // Don't create baseplates smaller than 2x2
    const smartOption = calculateSmartBaseplates(gridCountX, gridCountY, maxGridX, maxGridY, minBaseplateSize);
    
    if (smartOption) {
      // Use smart baseplate allocation
      const [xDivision, yDivision] = smartOption.layout;
      
      // Build the layout based on the smart divisions
      let currentY = 0;
      for (const height of yDivision) {
        let currentX = 0;
        for (const width of xDivision) {
          const item: LayoutItem = {
            x: currentX,
            y: currentY,
            width,
            height,
            type: "baseplate",
            pixelX: unitMath.multiply(currentX, gridSize),
            pixelY: unitMath.multiply(currentY, gridSize),
            pixelWidth: unitMath.multiply(width, gridSize),
            pixelHeight: unitMath.multiply(height, gridSize),
          };
          baseplates.push(`${width}x${height}`);
          newLayout.push(item);
          currentX = unitMath.add(currentX, width);
        }
        currentY = unitMath.add(currentY, height);
      }
      
      // Smart allocation handles all pieces in the main loop, no edge calculations needed
      useSmartAllocation = true;
    } else {
      // Fall back to regular algorithm
      useSmartAllocation = false;
    }
  }
  
  // Use regular algorithm if not using smart allocation
  if (!useSmartAllocation && (!preferUniformBaseplates || useHalfSize)) {
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