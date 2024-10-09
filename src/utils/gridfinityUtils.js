export const FULL_GRID_SIZE = 42; // mm
export const HALF_GRID_SIZE = 21; // mm
export const INCH_TO_MM = 25.4;

export const printerSizes = {
  'Bambu Lab A1': { x: 256, y: 256 },
  'Prusa i3 MK3S+': { x: 250, y: 210 },
  'Ender 3': { x: 220, y: 220 },
  'Custom': { x: 0, y: 0 },
};

export const splitSpacerIfNeeded = (spacer, maxWidth, maxHeight) => {
  const spacers = [];
  const fullWidthParts = Math.floor(spacer.pixelWidth / maxWidth);
  const fullHeightParts = Math.floor(spacer.pixelHeight / maxHeight);
  const remainderWidth = spacer.pixelWidth % maxWidth;
  const remainderHeight = spacer.pixelHeight % maxHeight;

  for (let i = 0; i < fullWidthParts; i++) {
    for (let j = 0; j < fullHeightParts; j++) {
      spacers.push({
        ...spacer,
        pixelX: spacer.pixelX + i * maxWidth,
        pixelY: spacer.pixelY + j * maxHeight,
        pixelWidth: maxWidth,
        pixelHeight: maxHeight
      });
    }
  }

  if (remainderWidth > 0) {
    for (let j = 0; j < fullHeightParts; j++) {
      spacers.push({
        ...spacer,
        pixelX: spacer.pixelX + fullWidthParts * maxWidth,
        pixelY: spacer.pixelY + j * maxHeight,
        pixelWidth: remainderWidth,
        pixelHeight: maxHeight
      });
    }
  }

  if (remainderHeight > 0) {
    for (let i = 0; i < fullWidthParts; i++) {
      spacers.push({
        ...spacer,
        pixelX: spacer.pixelX + i * maxWidth,
        pixelY: spacer.pixelY + fullHeightParts * maxHeight,
        pixelWidth: maxWidth,
        pixelHeight: remainderHeight
      });
    }
  }

  if (remainderWidth > 0 && remainderHeight > 0) {
    spacers.push({
      ...spacer,
      pixelX: spacer.pixelX + fullWidthParts * maxWidth,
      pixelY: spacer.pixelY + fullHeightParts * maxHeight,
      pixelWidth: remainderWidth,
      pixelHeight: remainderHeight
    });
  }

  return spacers;
};

export const fillSpacerWithHalfSizeBins = (spacer) => {
  const halfBinsX = Math.floor(spacer.pixelWidth / HALF_GRID_SIZE);
  const halfBinsY = Math.floor(spacer.pixelHeight / HALF_GRID_SIZE);
  const remainderWidth = spacer.pixelWidth % HALF_GRID_SIZE;
  const remainderHeight = spacer.pixelHeight % HALF_GRID_SIZE;

  const halfSizeBins = [];
  for (let x = 0; x < halfBinsX; x++) {
    for (let y = 0; y < halfBinsY; y++) {
      halfSizeBins.push({
        x: spacer.x + (x * HALF_GRID_SIZE / FULL_GRID_SIZE),
        y: spacer.y + (y * HALF_GRID_SIZE / FULL_GRID_SIZE),
        width: HALF_GRID_SIZE / FULL_GRID_SIZE,
        height: HALF_GRID_SIZE / FULL_GRID_SIZE,
        type: 'half-size',
        pixelX: spacer.pixelX + (x * HALF_GRID_SIZE),
        pixelY: spacer.pixelY + (y * HALF_GRID_SIZE),
        pixelWidth: HALF_GRID_SIZE,
        pixelHeight: HALF_GRID_SIZE
      });
    }
  }

  const remainingSpacers = [];
  if (remainderWidth > 0) {
    remainingSpacers.push({
      ...spacer,
      pixelX: spacer.pixelX + (halfBinsX * HALF_GRID_SIZE),
      pixelWidth: remainderWidth,
      pixelHeight: spacer.pixelHeight
    });
  }
  if (remainderHeight > 0) {
    remainingSpacers.push({
      ...spacer,
      pixelY: spacer.pixelY + (halfBinsY * HALF_GRID_SIZE),
      pixelHeight: remainderHeight,
      pixelWidth: halfBinsX * HALF_GRID_SIZE
    });
  }

  return { halfSizeBins, remainingSpacers };
};

export const combineHalfSizeBins = (halfSizeBins, maxWidth, maxHeight) => {
  const sortedBins = halfSizeBins.sort((a, b) => a.pixelX - b.pixelX || a.pixelY - b.pixelY);
  const combinedBins = [];

  let currentBin = null;
  for (const bin of sortedBins) {
    if (!currentBin) {
      currentBin = { ...bin, width: 1, height: 1 };
    } else if (currentBin.pixelX === bin.pixelX &&
               currentBin.pixelY + currentBin.pixelHeight === bin.pixelY &&
               currentBin.pixelHeight + HALF_GRID_SIZE <= maxHeight) {
      currentBin.pixelHeight += bin.pixelHeight;
      currentBin.height += 1;
    } else {
      combinedBins.push(currentBin);
      currentBin = { ...bin, width: 1, height: 1 };
    }
  }
  if (currentBin) {
    combinedBins.push(currentBin);
  }

  return combineBinsHorizontally(combinedBins, maxWidth);
};

export const combineBinsHorizontally = (bins, maxWidth) => {
  const sortedBins = bins.sort((a, b) => a.pixelY - b.pixelY || a.pixelX - b.pixelX);
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
    } else if (currentBin.pixelX + currentBin.pixelWidth === bin.pixelX &&
               currentBin.height === bin.height &&
               currentBin.pixelWidth + bin.pixelWidth <= maxWidth) {
      currentBin.pixelWidth += bin.pixelWidth;
      currentBin.width += bin.width;
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
  if (type === 'spacer') return 'rgba(255, 0, 0, 0.3)';
  if (type === 'half-size') return 'rgba(0, 255, 0, 0.3)';
  const hue = (index * 137.5) % 360;
  return `hsl(${hue}, 70%, 80%)`;
};
