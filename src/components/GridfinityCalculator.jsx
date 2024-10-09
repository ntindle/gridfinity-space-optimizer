import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
          
          {result && <GridfinityResults result={result} useHalfSize={useHalfSize} preferHalfSize={preferHalfSize} />}
          
          {layout.length > 0 && <GridfinityVisualPreview layout={layout} drawerSize={drawerSize} />}
        </div>
      </CardContent>
    </Card>
  );
};

export default GridfinityCalculator;