import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

const FULL_GRID_SIZE = 42; // mm
const HALF_GRID_SIZE = 21; // mm
const INCH_TO_MM = 25.4;

const printerSizes = {
  'Bambu Lab A1': { x: 256, y: 256 },
  'Prusa i3 MK3S+': { x: 250, y: 210 },
  'Ender 3': { x: 220, y: 220 },
  'Custom': { x: 0, y: 0 },
};

const GridfinityCalculator = () => {
  const [drawerSize, setDrawerSize] = useState({ width: 16.5, height: 22.5 });
  const [printerSize, setPrinterSize] = useState(printerSizes['Bambu Lab A1']);
  const [selectedPrinter, setSelectedPrinter] = useState('Bambu Lab A1');
  const [useHalfSize, setUseHalfSize] = useState(false);
  const [result, setResult] = useState(null);
  const [layout, setLayout] = useState([]);

  const splitSpacerIfNeeded = (spacer, maxWidth, maxHeight) => {
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

  const fillSpacerWithHalfSizeBins = (spacer) => {
    const halfBinsX = Math.floor(spacer.pixelWidth / HALF_GRID_SIZE);
    const halfBinsY = Math.floor(spacer.pixelHeight / HALF_GRID_SIZE);
    const remainderWidth = spacer.pixelWidth % HALF_GRID_SIZE;
    const remainderHeight = spacer.pixelHeight % HALF_GRID_SIZE;

    const halfSizeBins = [];
    for (let y = 0; y < halfBinsY; y++) {
      for (let x = 0; x < halfBinsX; x++) {
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

  const calculateGrids = () => {
    const drawerWidth = drawerSize.width * INCH_TO_MM;
    const drawerHeight = drawerSize.height * INCH_TO_MM;
    
    const gridSize = useHalfSize ? HALF_GRID_SIZE : FULL_GRID_SIZE;
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

    if (useHalfSize) {
      let halfSizeBins = [];
      let updatedSpacers = [];
      spacers.forEach(spacer => {
        const { halfSizeBins: bins, remainingSpacers } = fillSpacerWithHalfSizeBins(spacer);
        halfSizeBins = halfSizeBins.concat(bins);
        updatedSpacers = updatedSpacers.concat(remainingSpacers);
      });
      newLayout = newLayout.concat(halfSizeBins, updatedSpacers);
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
        const key = `${spacer.pixelWidth.toFixed(2)}mm x ${spacer.pixelHeight.toFixed(2)}mm`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    const halfSizeBinCount = newLayout.filter(item => item.type === 'half-size').length;
    
    setResult({ baseplates: counts, spacers: spacerCounts, halfSizeBins: halfSizeBinCount });
    setLayout(newLayout);
  };

  useEffect(() => {
    calculateGrids();
  }, [drawerSize, printerSize, useHalfSize]);

  const getColor = (type, index) => {
    if (type === 'spacer') return 'rgba(255, 0, 0, 0.3)';
    if (type === 'half-size') return 'rgba(0, 255, 0, 0.3)';
    const hue = (index * 137.5) % 360;
    return `hsl(${hue}, 70%, 80%)`;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Gridfinity Space Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Drawer Width (inches)</label>
              <Input
                type="number"
                value={drawerSize.width}
                onChange={(e) => setDrawerSize({ ...drawerSize, width: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Drawer Height (inches)</label>
              <Input
                type="number"
                value={drawerSize.height}
                onChange={(e) => setDrawerSize({ ...drawerSize, height: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Printer Model</label>
            <Select
              value={selectedPrinter}
              onValueChange={(value) => {
                setSelectedPrinter(value);
                setPrinterSize(value === 'Custom' ? { x: 0, y: 0 } : printerSizes[value]);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a printer" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(printerSizes).map((printer) => (
                  <SelectItem key={printer} value={printer}>
                    {printer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedPrinter === 'Custom' && (
            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Custom Width (mm)</label>
                <Input
                  type="number"
                  value={printerSize.x}
                  onChange={(e) => setPrinterSize({ ...printerSize, x: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Custom Height (mm)</label>
                <Input
                  type="number"
                  value={printerSize.y}
                  onChange={(e) => setPrinterSize({ ...printerSize, y: parseInt(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="use-half-size"
              checked={useHalfSize}
              onCheckedChange={setUseHalfSize}
            />
            <Label htmlFor="use-half-size">Use half-size bins (21x21mm)</Label>
          </div>
          
          <Button onClick={calculateGrids}>Calculate</Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Result:</h3>
              <h4 className="text-md font-semibold mt-2">Baseplates:</h4>
              <ul className="list-disc list-inside">
                {Object.entries(result.baseplates).map(([size, count]) => (
                  <li key={size}>{count} {size} baseplate(s)</li>
                ))}
              </ul>
              {useHalfSize && result.halfSizeBins > 0 && (
                <h4 className="text-md font-semibold mt-2">Half-size Bins:</h4>
              )}
              {useHalfSize && result.halfSizeBins > 0 && (
                <p>{result.halfSizeBins} half-size bin(s)</p>
              )}
              <h4 className="text-md font-semibold mt-2">Spacers:</h4>
              <ul className="list-disc list-inside">
                {Object.entries(result.spacers).map(([size, count]) => (
                  <li key={size}>{count} spacer(s): {size}</li>
                ))}
              </ul>
            </div>
          )}
          
          {layout.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Visual Preview:</h3>
              <div 
                style={{
                  width: `${drawerSize.width * 20}px`,
                  height: `${drawerSize.height * 20}px`,
                  border: '2px solid #000',
                  position: 'relative',
                }}
              >
                {layout.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${item.pixelX / INCH_TO_MM * 20}px`,
                      top: `${item.pixelY / INCH_TO_MM * 20}px`,
                      width: `${item.pixelWidth / INCH_TO_MM * 20}px`,
                      height: `${item.pixelHeight / INCH_TO_MM * 20}px`,
                      backgroundColor: getColor(item.type, index),
                      border: '1px solid #000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                    }}
                  >
                    {item.type === 'baseplate' ? `${item.width}x${item.height}` : item.type === 'half-size' ? 'Half' : 'Spacer'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GridfinityCalculator;
