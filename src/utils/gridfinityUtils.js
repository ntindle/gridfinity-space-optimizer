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
      spacers.push(createSpacer(spacer, i * maxWidth, j * maxHeight, maxWidth, maxHeight));
    }
  }

  if (remainderWidth > 0) {
    for (let j = 0; j < fullHeightParts; j++) {
      spacers.push(createSpacer(spacer, fullWidthParts * maxWidth, j * maxHeight, remainderWidth, maxHeight));
    }
  }

  if (remainderHeight > 0) {
    for (let i = 0; i < fullWidthParts; i++) {
      spacers.push(createSpacer(spacer, i * maxWidth, fullHeightParts * maxHeight, maxWidth, remainderHeight));
    }
  }

  if (remainderWidth > 0 && remainderHeight > 0) {
    spacers.push(createSpacer(spacer, fullWidthParts * maxWidth, fullHeightParts * maxHeight, remainderWidth, remainderHeight));
  }

  return spacers;
};

const createSpacer = (originalSpacer, offsetX, offsetY, width, height) => ({
  ...originalSpacer,
  pixelX: originalSpacer.pixelX + offsetX,
  pixelY: originalSpacer.pixelY + offsetY,
  pixelWidth: width,
  pixelHeight: height,
  width: Math.round(width / FULL_GRID_SIZE * 100) / 100,
  height: Math.round(height / FULL_GRID_SIZE * 100) / 100,
});

export const fillSpacerWithHalfSizeBins = (spacer) => {
  const halfBinsX = Math.floor(spacer.pixelWidth / HALF_GRID_SIZE);
  const halfBinsY = Math.floor(spacer.pixelHeight / HALF_GRID_SIZE);
  const remainderWidth = spacer.pixelWidth % HALF_GRID_SIZE;
  const remainderHeight = spacer.pixelHeight % HALF_GRID_SIZE;

  const halfSizeBins = [];
  for (let x = 0; x < halfBinsX; x++) {
    for (let y = 0; y < halfBinsY; y++) {
      halfSizeBins.push(createHalfSizeBin(spacer, x, y));
    }
  }

  const remainingSpacers = [];
  if (remainderWidth > 0) {
    remainingSpacers.push(createSpacer(spacer, halfBinsX * HALF_GRID_SIZE, 0, remainderWidth, spacer.pixelHeight));
  }
  if (remainderHeight > 0) {
    remainingSpacers.push(createSpacer(spacer, 0, halfBinsY * HALF_GRID_SIZE, halfBinsX * HALF_GRID_SIZE, remainderHeight));
  }

  return { halfSizeBins, remainingSpacers };
};

const createHalfSizeBin = (spacer, x, y) => ({
  x: spacer.x + (x * HALF_GRID_SIZE / FULL_GRID_SIZE),
  y: spacer.y + (y * HALF_GRID_SIZE / FULL_GRID_SIZE),
  width: 0.5,
  height: 0.5,
  type: 'half-size',
  pixelX: spacer.pixelX + (x * HALF_GRID_SIZE),
  pixelY: spacer.pixelY + (y * HALF_GRID_SIZE),
  pixelWidth: HALF_GRID_SIZE,
  pixelHeight: HALF_GRID_SIZE
});

export const combineHalfSizeBins = (halfSizeBins, maxWidth, maxHeight) => {
  const sortedBins = halfSizeBins.sort((a, b) => a.pixelX - b.pixelX || a.pixelY - b.pixelY);
  const combinedBins = [];

  let currentBin = null;
  for (const bin of sortedBins) {
    if (!currentBin) {
      currentBin = { ...bin, width: 0.5, height: 0.5 };
    } else if (currentBin.pixelX === bin.pixelX &&
               currentBin.pixelY + currentBin.pixelHeight === bin.pixelY &&
               currentBin.pixelHeight + HALF_GRID_SIZE <= maxHeight) {
      currentBin.pixelHeight += bin.pixelHeight;
      currentBin.height += 0.5;
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

export const calculateGrids = (drawerSize, printerSize, useHalfSize, preferHalfSize) => {
  const drawerWidth = drawerSize.width * INCH_TO_MM;
  const drawerHeight = drawerSize.height * INCH_TO_MM;
  
  const gridSize = FULL_GRID_SIZE;
  const gridCountX = Math.floor(drawerWidth / gridSize);
  const gridCountY = Math.floor(drawerHeight / gridSize);
  
  const maxPrintSizeX = Math.floor(printerSize.x / gridSize) * gridSize;
  const maxPrintSizeY = Math.floor(printerSize.y / gridSize) * gridSize;
  
  let baseplates = [];
  let newLayout = [];
  let remainingWidth = drawerWidth - (gridCountX * gridSize);
  let remainingHeight = drawerHeight - (gridCountY * gridSize);
  
  for (let y = 0; y < gridCountY; y += maxPrintSizeY / gridSize) {
    for (let x = 0; x < gridCountX; x += maxPrintSizeX / gridSize) {
      const width = Math.min(maxPrintSizeX / gridSize, gridCountX - x);
      const height = Math.min(maxPrintSizeY / gridSize, gridCountY - y);
      baseplates.push(`${width}x${height}`);
      newLayout.push({ 
        x, y, width, height, 
        type: 'baseplate',
        pixelX: x * gridSize,
        pixelY: y * gridSize,
        pixelWidth: width * gridSize,
        pixelHeight: height * gridSize
      });
    }
  }
  
  let spacers = [];

  // Add horizontal spacer if needed
  if (remainingWidth > 0) {
    spacers = spacers.concat(splitSpacerIfNeeded({
      x: gridCountX,
      y: 0,
      width: remainingWidth / gridSize,
      height: gridCountY,
      type: 'spacer',
      pixelX: gridCountX * gridSize,
      pixelY: 0,
      pixelWidth: remainingWidth,
      pixelHeight: gridCountY * gridSize
    }, maxPrintSizeX, maxPrintSizeY));
  }
  
  // Add vertical spacer if needed
  if (remainingHeight > 0) {
    spacers = spacers.concat(splitSpacerIfNeeded({
      x: 0,
      y: gridCountY,
      width: gridCountX,
      height: remainingHeight / gridSize,
      type: 'spacer',
      pixelX: 0,
      pixelY: gridCountY * gridSize,
      pixelWidth: gridCountX * gridSize,
      pixelHeight: remainingHeight
    }, maxPrintSizeX, maxPrintSizeY));
  }
  
  // Add corner spacer if needed
  if (remainingWidth > 0 && remainingHeight > 0) {
    spacers = spacers.concat(splitSpacerIfNeeded({
      x: gridCountX,
      y: gridCountY,
      width: remainingWidth / gridSize,
      height: remainingHeight / gridSize,
      type: 'spacer',
      pixelX: gridCountX * gridSize,
      pixelY: gridCountY * gridSize,
      pixelWidth: remainingWidth,
      pixelHeight: remainingHeight
    }, maxPrintSizeX, maxPrintSizeY));
  }

  let halfSizeBins = [];
  let updatedSpacers = [];
  if (useHalfSize || preferHalfSize) {
    spacers.forEach(spacer => {
      const { halfSizeBins: bins, remainingSpacers } = fillSpacerWithHalfSizeBins(spacer);
      halfSizeBins = halfSizeBins.concat(bins);
      updatedSpacers = updatedSpacers.concat(remainingSpacers);
    });
    
    // Combine half-size bins into grids, constrained by max print size
    const combinedHalfSizeBins = combineHalfSizeBins(halfSizeBins, maxPrintSizeX, maxPrintSizeY);
    
    if (preferHalfSize) {
      // Only replace spacers with half-size bins
      newLayout = newLayout.concat(combinedHalfSizeBins, updatedSpacers);
    } else {
      // Replace everything with half-size bins
      newLayout = combinedHalfSizeBins.concat(updatedSpacers);
    }
  } else {
    newLayout = newLayout.concat(spacers);
  }
  
  const counts = baseplates.reduce((acc, plate) => {
    acc[plate] = (acc[plate] || 0) + 1;
    return acc;
  }, {});

  const spacerCounts = newLayout
    .filter(item => item.type === 'spacer')
    .reduce((acc, spacer) => {
      const key = `${(spacer.width * FULL_GRID_SIZE).toFixed(2)}mm x ${(spacer.height * FULL_GRID_SIZE).toFixed(2)}mm`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  const halfSizeBinCounts = newLayout
    .filter(item => item.type === 'half-size')
    .reduce((acc, bin) => {
      const key = `${bin.width}x${bin.height}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  return { baseplates: counts, spacers: spacerCounts, halfSizeBins: halfSizeBinCounts, layout: newLayout };
};