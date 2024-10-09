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

  useEffect(() => {
    const { baseplates, spacers, halfSizeBins, layout } = calculateGrids(drawerSize, printerSize, useHalfSize, preferHalfSize);
    setResult({ baseplates, spacers, halfSizeBins });
    setLayout(layout);
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize]);

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
              <Select
                value={selectedPrinter}
                onValueChange={(value) => {
                  setSelectedPrinter(value);
                  setPrinterSize(value === 'Custom' ? { x: 0, y: 0 } : printerSizes[value]);
                }}
              >
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
                    value={printerSize.x}
                    onChange={(e) => setPrinterSize({ ...printerSize, x: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customHeight">Custom Height (mm)</Label>
                  <Input
                    id="customHeight"
                    type="number"
                    value={printerSize.y}
                    onChange={(e) => setPrinterSize({ ...printerSize, y: parseInt(e.target.value) })}
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

      {result && (
        <Card>
          <CardContent className="p-4">
            <GridfinityResults result={result} useHalfSize={useHalfSize} preferHalfSize={preferHalfSize} />
          </CardContent>
        </Card>
      )}
      
      {layout.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <GridfinityVisualPreview layout={layout} drawerSize={drawerSize} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GridfinityCalculator;