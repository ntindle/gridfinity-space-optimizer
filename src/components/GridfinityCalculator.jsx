import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { INCH_TO_MM, printerSizes, calculateGrids } from '../utils/gridfinityUtils';
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
  const [numDrawers, setNumDrawers] = useState(1);
  const [customSize, setCustomSize] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const { baseplates, spacers, halfSizeBins, layout } = calculateGrids(drawerSize, printerSize, useHalfSize, preferHalfSize);
    setResult({ baseplates, spacers, halfSizeBins, numDrawers });
    setLayout(layout);
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize, numDrawers]);

  const handlePrinterChange = (value) => {
    setSelectedPrinter(value);
    if (value === 'Custom') {
      setPrinterSize(customSize);
    } else {
      setPrinterSize(printerSizes[value]);
    }
  };

  const handleCustomSizeChange = (axis, value) => {
    const newCustomSize = { ...customSize, [axis]: parseInt(value) };
    setCustomSize(newCustomSize);
    if (selectedPrinter === 'Custom') {
      setPrinterSize(newCustomSize);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Drawer Dimensions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="drawerWidth">Width (inches)</Label>
              <Input
                id="drawerWidth"
                type="number"
                value={drawerSize.width}
                onChange={(e) => setDrawerSize({ ...drawerSize, width: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="drawerHeight">Height (inches)</Label>
              <Input
                id="drawerHeight"
                type="number"
                value={drawerSize.height}
                onChange={(e) => setDrawerSize({ ...drawerSize, height: parseFloat(e.target.value) })}
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Printer Settings</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="printerModel">Printer Model</Label>
              <Select onValueChange={handlePrinterChange} value={selectedPrinter}>
                <SelectTrigger className="w-full mt-1">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customWidth">Custom Width (mm)</Label>
                  <Input
                    id="customWidth"
                    type="number"
                    value={customSize.x}
                    onChange={(e) => handleCustomSizeChange('x', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customHeight">Custom Height (mm)</Label>
                  <Input
                    id="customHeight"
                    type="number"
                    value={customSize.y}
                    onChange={(e) => handleCustomSizeChange('y', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Bin Options</h3>
          <div className="space-y-4">
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4">Drawer Options</h3>
          <div>
            <Label htmlFor="numDrawers">Number of Duplicate Drawers</Label>
            <Input
              id="numDrawers"
              type="number"
              min="1"
              value={numDrawers}
              onChange={(e) => setNumDrawers(Math.max(1, parseInt(e.target.value) || 1))}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {result && layout.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4">
              <GridfinityResults result={result} useHalfSize={useHalfSize} preferHalfSize={preferHalfSize} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <GridfinityVisualPreview layout={layout} drawerSize={drawerSize} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GridfinityCalculator;