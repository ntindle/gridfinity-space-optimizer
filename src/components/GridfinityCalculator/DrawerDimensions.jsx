import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const DrawerDimensions = ({ drawerSize, setDrawerSize, unit, setUnit }) => {
  const handleSizeChange = (dimension, value) => {
    const numValue = parseFloat(value) || 0;
    const sizeInMm = unit === 'in' ? numValue * 25.4 : numValue;
    setDrawerSize(prev => ({ ...prev, [dimension]: sizeInMm }));
  };

  const displayValue = (value) => {
    const numValue = parseFloat(value) || 0;
    return unit === 'in' ? (numValue / 25.4).toFixed(2) : numValue.toFixed(2);
  };

  return (
    <div className="w-full max-w-sm space-y-6 p-4">
      <h3 className="text-lg font-semibold">Drawer Dimensions</h3>
      <div className="flex items-center justify-between mb-4">
        <Label>Unit</Label>
        <ToggleGroup type="single" value={unit} onValueChange={(value) => value && setUnit(value)}>
          <ToggleGroupItem value="mm">mm</ToggleGroupItem>
          <ToggleGroupItem value="in">in</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex items-end space-x-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="drawerWidth">Width ({unit})</Label>
          <Input
            id="drawerWidth"
            type="number"
            value={displayValue(drawerSize.width)}
            onChange={(e) => handleSizeChange('width', e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="drawerHeight">Height ({unit})</Label>
          <Input
            id="drawerHeight"
            type="number"
            value={displayValue(drawerSize.height)}
            onChange={(e) => handleSizeChange('height', e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default DrawerDimensions;