import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const DrawerDimensions = ({ drawerSize, setDrawerSize, useMm, setUseMm }) => {
  const [localWidth, setLocalWidth] = useState("");
  const [localHeight, setLocalHeight] = useState("");

  const convertToMm = (value) => (value * 25.4).toFixed(2);
  const convertToInches = (value) => (value / 25.4).toFixed(4);

  useEffect(() => {
    updateLocalValues(drawerSize.width, drawerSize.height);
  }, [useMm, drawerSize]);

  const updateLocalValues = (width, height) => {
    if (useMm) {
      setLocalWidth(convertToMm(width));
      setLocalHeight(convertToMm(height));
    } else {
      setLocalWidth(width.toFixed(4));
      setLocalHeight(height.toFixed(4));
    }
  };

  const handleInputChange = (dimension) => (e) => {
    const value = e.target.value;
    if (dimension === "width") {
      setLocalWidth(value);
    } else {
      setLocalHeight(value);
    }

    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      const inchesValue = useMm ? parseFloat(convertToInches(numericValue)) : numericValue;
      setDrawerSize((prevSize) => ({
        ...prevSize,
        [dimension]: inchesValue,
      }));
    }
  };

  const handleUnitToggle = (checked) => {
    setUseMm(checked);
  };

  const formatDisplayValue = (value) => {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? "" : numValue.toString();
  };

  return (
    <div className="w-full max-w-sm space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Drawer Dimensions</h3>
        <div className="flex items-center space-x-2">
          <Label htmlFor="unit-toggle">Inches</Label>
          <Switch
            id="unit-toggle"
            checked={useMm}
            onCheckedChange={handleUnitToggle}
          />
          <Label htmlFor="unit-toggle">mm</Label>
        </div>
      </div>
      <div className="flex items-end space-x-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="drawerWidth">Width ({useMm ? "mm" : "inches"})</Label>
          <Input
            id="drawerWidth"
            type="number"
            value={formatDisplayValue(localWidth)}
            onChange={handleInputChange("width")}
            className="w-full"
            step="any"
            min="0"
            onFocus={(e) => e.target.select()}
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label htmlFor="drawerHeight">Height ({useMm ? "mm" : "inches"})</Label>
          <Input
            id="drawerHeight"
            type="number"
            value={formatDisplayValue(localHeight)}
            onChange={handleInputChange("height")}
            className="w-full"
            step="any"
            min="0"
            onFocus={(e) => e.target.select()}
          />
        </div>
      </div>
    </div>
  );
};

export default DrawerDimensions;
