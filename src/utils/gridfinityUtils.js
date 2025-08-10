import { unitMath } from '@/services/unitMath';

export const FULL_GRID_SIZE = 42; // mm
export const HALF_GRID_SIZE = 21; // mm
export const INCH_TO_MM = 25.4;

export const splitSpacerIfNeeded = (spacer, maxWidth, maxHeight) => {
  const spacers = [];
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

const createSpacer = (originalSpacer, offsetX, offsetY, width, height) => ({
  ...originalSpacer,
  pixelX: unitMath.add(originalSpacer.pixelX, offsetX),
  pixelY: unitMath.add(originalSpacer.pixelY, offsetY),
  pixelWidth: width,
  pixelHeight: height,
  width: unitMath.round(unitMath.divide(width, FULL_GRID_SIZE), 2),
  height: unitMath.round(unitMath.divide(height, FULL_GRID_SIZE), 2),
});
export const fillSpacerWithHalfSizeBins = (spacer) => {
  const halfBinsX = unitMath.floor(unitMath.divide(spacer.pixelWidth, HALF_GRID_SIZE));
  const halfBinsY = unitMath.floor(unitMath.divide(spacer.pixelHeight, HALF_GRID_SIZE));
  const remainderWidth = unitMath.mod(spacer.pixelWidth, HALF_GRID_SIZE);
  const remainderHeight = unitMath.mod(spacer.pixelHeight, HALF_GRID_SIZE);

  const halfSizeBins = [];
  for (let x = 0; x < halfBinsX; x++) {
    for (let y = 0; y < halfBinsY; y++) {
      halfSizeBins.push(createHalfSizeBin(spacer, x, y));
    }
  }

  const remainingSpacers = [];
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

const createHalfSizeBin = (spacer, x, y) => ({
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

export const combineHalfSizeBins = (halfSizeBins, maxWidth, maxHeight) => {
  const sortedBins = halfSizeBins.sort(
    (a, b) => unitMath.subtract(a.pixelX, b.pixelX) || unitMath.subtract(a.pixelY, b.pixelY)
  );
  const combinedBins = [];

  let currentBin = null;
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

const combineBinsHorizontally = (bins, maxWidth) => {
  const sortedBins = bins.sort(
    (a, b) => unitMath.subtract(a.pixelY, b.pixelY) || unitMath.subtract(a.pixelX, b.pixelX)
  );
  const finalBins = [];

  let currentRow = [];
  let currentY = null;

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

const combineRow = (row, maxWidth) => {
  const combinedRow = [];
  let currentBin = null;

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

export const getColor = (type, index) => {
  if (type === "spacer") return "rgba(255, 0, 0, 0.3)";
  if (type === "half-size") return "rgba(0, 255, 0, 0.3)";
  const hue = unitMath.mod(unitMath.multiply(index, 137.5), 360);
  return `hsl(${hue}, 70%, 80%)`;
};

export const calculateGrids = (
  drawerSize,
  printerSize,
  useHalfSize,
  preferHalfSize
) => {
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

  const maxPrintSizeX = unitMath.multiply(unitMath.floor(unitMath.divide(printerSize.x, gridSize)), gridSize);
  const maxPrintSizeY = unitMath.multiply(unitMath.floor(unitMath.divide(printerSize.y, gridSize)), gridSize);

  let baseplates = [];
  let newLayout = [];
  let remainingWidth = unitMath.subtract(drawerWidth, unitMath.multiply(gridCountX, gridSize));
  let remainingHeight = unitMath.subtract(drawerHeight, unitMath.multiply(gridCountY, gridSize));

  for (let y = 0; y < gridCountY; y += unitMath.divide(maxPrintSizeY, gridSize)) {
    for (let x = 0; x < gridCountX; x += unitMath.divide(maxPrintSizeX, gridSize)) {
      const width = unitMath.min(unitMath.divide(maxPrintSizeX, gridSize), unitMath.subtract(gridCountX, x));
      const height = unitMath.min(unitMath.divide(maxPrintSizeY, gridSize), unitMath.subtract(gridCountY, y));
      const item = {
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

  let spacers = [];

  // Add horizontal spacer if needed (only if there's actual remaining width)
  if (!unitMath.approxEqual(remainingWidth, 0, 0.01)) {  // Use mathjs for precise comparison
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
  if (!unitMath.approxEqual(remainingHeight, 0, 0.01)) {  // Use mathjs for precise comparison
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
  if (!unitMath.approxEqual(remainingWidth, 0, 0.01) && !unitMath.approxEqual(remainingHeight, 0, 0.01)) {  // Use mathjs
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

  let halfSizeBins = [];
  let updatedSpacers = [];
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

  const counts = baseplates.reduce((acc, plate) => {
    acc[plate] = unitMath.add(acc[plate] || 0, 1);
    return acc;
  }, {});

  const spacerCounts = newLayout
    .filter((item) => item.type === "spacer")
    .reduce((acc, spacer) => {
      const key = `${unitMath.round(unitMath.multiply(spacer.width, gridSize), 2)}mm x ${unitMath.round(
        unitMath.multiply(spacer.height, gridSize), 2
      )}mm`;
      acc[key] = unitMath.add(acc[key] || 0, 1);
      return acc;
    }, {});

  const halfSizeBinCounts = newLayout
    .filter((item) => item.type === "half-size")
    .reduce((acc, bin) => {
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
