import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FULL_GRID_SIZE, HALF_GRID_SIZE, INCH_TO_MM, printerSizes, splitSpacerIfNeeded, fillSpacerWithHalfSizeBins, combineHalfSizeBins, getColor } from '../utils/gridfinityUtils';
import GridfinityResults from './GridfinityResults';
import GridfinityVisualPreview from './GridfinityVisualPreview';

const GridfinityCalculator = () => {
  const [drawerSize, setDrawerSize] = useState({ width: 16.5, height: 22.5 });
  const [printerSize, setPrinterSize] = useState(printerSizes['Bambu Lab A1']);
  const [selectedPrinter, setSelectedPrinter] = useState('Bambu Lab A1');
  const [useHalfSize, setUseHalfSize] = useState(false);
  const [preferHalfSize, setPreferHalfSize] = useState(false);
  const [result, setResult] = useState(null);
  const [layout, setLayout] = useState([]);

  const calculateGrids = () => {
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

    if (useHalfSize || preferHalfSize) {
      let halfSizeBins = [];
      let updatedSpacers = [];
      spacers.forEach(spacer => {
        const { halfSizeBins: bins, remainingSpacers } = fillSpacerWithHalfSizeBins(spacer);
        halfSizeBins = halfSizeBins.concat(bins);
        updatedSpacers = updatedSpacers.concat(remainingSpacers);
      });
      
      // Combine half-size bins into grids
      const combinedHalfSizeBins = combineHalfSizeBins(halfSizeBins);
      
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
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize]);

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
              onCheckedChange={(checked) => {
                setUseHalfSize(checked);
                if (checked) setPreferHalfSize(false);
              }}
            />
            <Label htmlFor="use-half-size">Use only half-size bins (21x21mm)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="prefer-half-size"
              checked={preferHalfSize}
              onCheckedChange={(checked) => {
                setPreferHalfSize(checked);
                if (checked) setUseHalfSize(false);
              }}
            />
            <Label htmlFor="prefer-half-size">Prefer half-size bins for spacers</Label>
          </div>
          
          <Button onClick={calculateGrids}>Calculate</Button>
          
          {result && <GridfinityResults result={result} useHalfSize={useHalfSize} preferHalfSize={preferHalfSize} />}
          
          {layout.length > 0 && <GridfinityVisualPreview layout={layout} drawerSize={drawerSize} />}
        </div>
      </CardContent>
    </Card>
  );
};

export default GridfinityCalculator;