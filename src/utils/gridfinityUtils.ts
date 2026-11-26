import { unitMath } from '@/services/unitMath';
import type { 
  DrawerSize, 
  PrinterSize, 
  LayoutItem, 
  GridfinityResult
} from '@/types';

export const FULL_GRID_SIZE = 42;
export const HALF_GRID_SIZE = 21;
export const INCH_TO_MM = 25.4;

const PIECE_COUNT_PENALTY = 10;
const VARIETY_PENALTY = 20;
const SMALL_PIECE_PENALTY = 5;
const MIN_DESIRABLE_SIZE_RATIO = 0.4;
const PREFERRED_ROUND_SIZES = [3, 4, 5];
const ROUND_SIZE_BONUS = 2;
const BASEPLATE_VARIETY_PENALTY = 15;

export const splitSpacerIfNeeded = (
  spacer: LayoutItem, 
  maxWidth: number, 
  maxHeight: number,
  gridSize: number = FULL_GRID_SIZE
): LayoutItem[] => {
  const spacers: LayoutItem[] = [];
  const fullWidthParts = unitMath.floor(unitMath.divide(spacer.pixelWidth, maxWidth));
  const fullHeightParts = unitMath.floor(unitMath.divide(spacer.pixelHeight, maxHeight));
  const remainderWidth = unitMath.mod(spacer.pixelWidth, maxWidth);
  const remainderHeight = unitMath.mod(spacer.pixelHeight, maxHeight);

  for (let i = 0; i < fullWidthParts; i++) {
    for (let j = 0; j < fullHeightParts; j++) {
      spacers.push(
        createSpacer(spacer, unitMath.multiply(i, maxWidth), unitMath.multiply(j, maxHeight), maxWidth, maxHeight, gridSize)
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
          maxHeight,
          gridSize
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
          remainderHeight,
          gridSize
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
        remainderHeight,
        gridSize
      )
    );
  }

  return spacers;
};

const createSpacer = (
  originalSpacer: LayoutItem, 
  offsetX: number, 
  offsetY: number, 
  width: number, 
  height: number,
  gridSize: number = FULL_GRID_SIZE
): LayoutItem => ({
  ...originalSpacer,
  x: unitMath.add(originalSpacer.x, unitMath.divide(offsetX, gridSize)),
  y: unitMath.add(originalSpacer.y, unitMath.divide(offsetY, gridSize)),
  pixelX: unitMath.add(originalSpacer.pixelX, offsetX),
  pixelY: unitMath.add(originalSpacer.pixelY, offsetY),
  pixelWidth: width,
  pixelHeight: height,
  width: unitMath.round(unitMath.divide(width, gridSize), 2),
  height: unitMath.round(unitMath.divide(height, gridSize), 2),
});

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
  if (remainderHeight > 0 && halfBinsX > 0) {
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

export const getColor = (type: LayoutItem['type'], index: number): string => {
  if (type === "spacer") return "rgba(255, 0, 0, 0.3)";
  if (type === "half-size") return "rgba(0, 255, 0, 0.3)";
  const hue = unitMath.mod(unitMath.multiply(index, 137.5), 360);
  return `hsl(${hue}, 70%, 80%)`;
};

const findDivisions = (length: number, maxSize: number, minSize: number = 2): number[][] => {
  const divisions: number[][] = [];
  
  for (let baseSize = maxSize; baseSize >= minSize; baseSize--) {
    const fullPieces = unitMath.floor(unitMath.divide(length, baseSize));
    const remainder = unitMath.mod(length, baseSize);
    
    if (fullPieces === 0) continue;
    
    if (remainder === 0) {
      divisions.push(Array(fullPieces).fill(baseSize));
    } else if (remainder >= minSize) {
      divisions.push([...Array(fullPieces).fill(baseSize), remainder]);
    } else if (fullPieces > 1) {
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

const scoreDivision = (division: number[], maxSize: number): number => {
  let score = 0;
  
  score += division.length * PIECE_COUNT_PENALTY;
  
  const uniqueSizes = new Set(division).size;
  score += uniqueSizes * VARIETY_PENALTY;
  
  const minDesirable = unitMath.multiply(maxSize, MIN_DESIRABLE_SIZE_RATIO);
  division.forEach(size => {
    if (size < minDesirable) {
      score += unitMath.multiply(unitMath.subtract(minDesirable, size), SMALL_PIECE_PENALTY);
    }
  });
  
  division.forEach(size => {
    if (PREFERRED_ROUND_SIZES.includes(size)) {
      score -= ROUND_SIZE_BONUS;
    }
  });
  
  return score;
};

const calculateSmartBaseplates = (
  gridCountX: number,
  gridCountY: number,
  maxGridX: number,
  maxGridY: number,
  minBaseplateSize: number = 2,
  edgeCapX?: number,
  edgeCapY?: number
): { layout: number[][]; score: number } | null => {
  const xDivisions = findDivisions(gridCountX, maxGridX, minBaseplateSize).filter(
    (division) => edgeCapX === undefined || division[division.length - 1] <= edgeCapX
  );
  const yDivisions = findDivisions(gridCountY, maxGridY, minBaseplateSize).filter(
    (division) => edgeCapY === undefined || division[division.length - 1] <= edgeCapY
  );
  
  if (xDivisions.length === 0 || yDivisions.length === 0) {
    return null;
  }
  
  let bestLayout: number[][] | null = null;
  let bestScore = Infinity;
  
  for (const xDiv of xDivisions) {
    for (const yDiv of yDivisions) {
      const xScore = scoreDivision(xDiv, maxGridX);
      const yScore = scoreDivision(yDiv, maxGridY);
      const totalScore = xScore + yScore;
      
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

export const layoutCountKey = (item: LayoutItem): string => {
  const extendRight = unitMath.round(item.extendRightMm ?? 0, 2);
  const extendBottom = unitMath.round(item.extendBottomMm ?? 0, 2);
  if (extendRight === 0 && extendBottom === 0) {
    return `${item.width}x${item.height}`;
  }
  return `${item.width}x${item.height}+${extendRight}+${extendBottom}`;
};

const edgeDivision = (total: number, maxCells: number, edgeCap: number): number[] => {
  if (total <= edgeCap) return [total];
  let pieces = unitMath.ceil(unitMath.divide(total, maxCells));
  while (unitMath.add(unitMath.multiply(unitMath.subtract(pieces, 1), maxCells), edgeCap) < total) {
    pieces = unitMath.add(pieces, 1);
  }
  const last = unitMath.min(edgeCap, unitMath.subtract(total, unitMath.subtract(pieces, 1)));
  const rest = unitMath.subtract(total, last);
  const restPieces = unitMath.subtract(pieces, 1);
  const base = unitMath.floor(unitMath.divide(rest, restPieces));
  const extra = unitMath.subtract(rest, unitMath.multiply(base, restPieces));
  return [
    ...Array(extra).fill(unitMath.add(base, 1)),
    ...Array(unitMath.subtract(restPieces, extra)).fill(base),
    last,
  ];
};

export const calculateGrids = (
  drawerSize: DrawerSize,
  printerSize: PrinterSize,
  useHalfSize: boolean,
  preferHalfSize: boolean,
  preferUniformBaseplates: boolean = false,
  spacerless: boolean = false
): GridfinityResult => {
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

  let effectiveX = printerSize.x;
  let effectiveY = printerSize.y;
  
  if (printerSize.exclusionZone) {
    const { left = 0, right = 0, front = 0, back = 0 } = printerSize.exclusionZone;
    effectiveX = unitMath.subtract(effectiveX, unitMath.add(left, right));
    effectiveY = unitMath.subtract(effectiveY, unitMath.add(front, back));
  }

  const maxPrintSizeX = unitMath.multiply(unitMath.floor(unitMath.divide(effectiveX, gridSize)), gridSize);
  const maxPrintSizeY = unitMath.multiply(unitMath.floor(unitMath.divide(effectiveY, gridSize)), gridSize);

  if (maxPrintSizeX < gridSize || maxPrintSizeY < gridSize) {
    return {
      baseplates: {},
      spacers: {},
      halfSizeBins: {},
      layout: [],
    };
  }

  let newLayout: LayoutItem[] = [];
  const remainingWidth = unitMath.subtract(drawerWidth, unitMath.multiply(gridCountX, gridSize));
  const remainingHeight = unitMath.subtract(drawerHeight, unitMath.multiply(gridCountY, gridSize));

  const edgeCapX = unitMath.floor(
    unitMath.divide(unitMath.subtract(effectiveX, remainingWidth), gridSize)
  );
  const edgeCapY = unitMath.floor(
    unitMath.divide(unitMath.subtract(effectiveY, remainingHeight), gridSize)
  );
  const spacerlessX =
    spacerless && !unitMath.approxEqual(remainingWidth, 0, 0.01) && edgeCapX >= 1;
  const spacerlessY =
    spacerless && !unitMath.approxEqual(remainingHeight, 0, 0.01) && edgeCapY >= 1;

  let useSmartAllocation = false;

  if (preferUniformBaseplates && !useHalfSize) {
    const maxGridX = unitMath.divide(maxPrintSizeX, gridSize);
    const maxGridY = unitMath.divide(maxPrintSizeY, gridSize);
    const minBaseplateSize = 2;
    const smartOption = calculateSmartBaseplates(
      gridCountX,
      gridCountY,
      maxGridX,
      maxGridY,
      minBaseplateSize,
      spacerlessX ? edgeCapX : undefined,
      spacerlessY ? edgeCapY : undefined
    );
    
    if (smartOption) {
      const [xDivision, yDivision] = smartOption.layout;
      
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
          newLayout.push(item);
          currentX = unitMath.add(currentX, width);
        }
        currentY = unitMath.add(currentY, height);
      }
      
      useSmartAllocation = true;
    } else {
      useSmartAllocation = false;
    }
  }
  
  if (!useSmartAllocation) {
    const maxCellsX = unitMath.divide(maxPrintSizeX, gridSize);
    const maxCellsY = unitMath.divide(maxPrintSizeY, gridSize);
    const xDivision = spacerlessX
      ? edgeDivision(gridCountX, maxCellsX, edgeCapX)
      : null;
    const yDivision = spacerlessY
      ? edgeDivision(gridCountY, maxCellsY, edgeCapY)
      : null;
    const xPieces: { x: number; width: number }[] = [];
    if (xDivision) {
      let cursor = 0;
      for (const width of xDivision) {
        xPieces.push({ x: cursor, width });
        cursor = unitMath.add(cursor, width);
      }
    } else {
      for (let x = 0; x < gridCountX; x = unitMath.add(x, maxCellsX)) {
        xPieces.push({
          x,
          width: unitMath.min(maxCellsX, unitMath.subtract(gridCountX, x)),
        });
      }
    }
    const yPieces: { y: number; height: number }[] = [];
    if (yDivision) {
      let cursor = 0;
      for (const height of yDivision) {
        yPieces.push({ y: cursor, height });
        cursor = unitMath.add(cursor, height);
      }
    } else {
      for (let y = 0; y < gridCountY; y = unitMath.add(y, maxCellsY)) {
        yPieces.push({
          y,
          height: unitMath.min(maxCellsY, unitMath.subtract(gridCountY, y)),
        });
      }
    }
    for (const { y, height } of yPieces) {
      for (const { x, width } of xPieces) {
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
        newLayout.push(item);
      }
    }
  }

  if (spacerlessX || spacerlessY) {
    newLayout = newLayout.map((item) => {
      const extended = { ...item };
      if (spacerlessX && unitMath.add(item.x, item.width) === gridCountX) {
        extended.pixelWidth = unitMath.add(item.pixelWidth, remainingWidth);
        extended.extendRightMm = remainingWidth;
      }
      if (spacerlessY && unitMath.add(item.y, item.height) === gridCountY) {
        extended.pixelHeight = unitMath.add(item.pixelHeight, remainingHeight);
        extended.extendBottomMm = remainingHeight;
      }
      return extended;
    });
  }

  let spacers: LayoutItem[] = [];

  if (!spacerlessX && !unitMath.approxEqual(remainingWidth, 0, 0.01)) {
    const spacerPixelHeight = unitMath.add(
      unitMath.multiply(gridCountY, gridSize),
      spacerlessY ? remainingHeight : 0
    );
    spacers = spacers.concat(
      splitSpacerIfNeeded(
        {
          x: gridCountX,
          y: 0,
          width: unitMath.divide(remainingWidth, gridSize),
          height: unitMath.divide(spacerPixelHeight, gridSize),
          type: "spacer",
          pixelX: unitMath.multiply(gridCountX, gridSize),
          pixelY: 0,
          pixelWidth: remainingWidth,
          pixelHeight: spacerPixelHeight,
        },
        maxPrintSizeX,
        maxPrintSizeY,
        gridSize
      )
    );
  }

  if (!spacerlessY && !unitMath.approxEqual(remainingHeight, 0, 0.01)) {
    const spacerPixelWidth = unitMath.add(
      unitMath.multiply(gridCountX, gridSize),
      spacerlessX ? remainingWidth : 0
    );
    spacers = spacers.concat(
      splitSpacerIfNeeded(
        {
          x: 0,
          y: gridCountY,
          width: unitMath.divide(spacerPixelWidth, gridSize),
          height: unitMath.divide(remainingHeight, gridSize),
          type: "spacer",
          pixelX: 0,
          pixelY: unitMath.multiply(gridCountY, gridSize),
          pixelWidth: spacerPixelWidth,
          pixelHeight: remainingHeight,
        },
        maxPrintSizeX,
        maxPrintSizeY,
        gridSize
      )
    );
  }

  if (!spacerlessX && !spacerlessY && !unitMath.approxEqual(remainingWidth, 0, 0.01) && !unitMath.approxEqual(remainingHeight, 0, 0.01)) {
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
        maxPrintSizeY,
        gridSize
      )
    );
  }

  let halfSizeBins: LayoutItem[] = [];
  let updatedSpacers: LayoutItem[] = [];
  if (preferHalfSize && !useHalfSize && !spacerless) {
    spacers.forEach((spacer) => {
      const { halfSizeBins: bins, remainingSpacers } =
        fillSpacerWithHalfSizeBins(spacer);
      halfSizeBins = halfSizeBins.concat(bins);
      updatedSpacers = updatedSpacers.concat(remainingSpacers);
    });

    const combinedHalfSizeBins = combineHalfSizeBins(
      halfSizeBins,
      maxPrintSizeX,
      maxPrintSizeY
    );

    newLayout = newLayout.concat(combinedHalfSizeBins, updatedSpacers);
  } else {
    newLayout = newLayout.concat(spacers);
  }

  const counts = newLayout
    .filter((item) => item.type === "baseplate")
    .reduce<Record<string, number>>((acc, item) => {
      const key = layoutCountKey(item);
      acc[key] = unitMath.add(acc[key] || 0, 1);
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
      const key = layoutCountKey(bin);
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