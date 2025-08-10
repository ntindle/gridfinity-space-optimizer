import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DrawerOptions = ({ numDrawers, setNumDrawers }) => {
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setNumDrawers("");
    } else {
      const parsedValue = parseInt(value, 10);
      setNumDrawers(isNaN(parsedValue) ? 1 : Math.max(1, parsedValue));
    }
  };

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-lg font-semibold">Drawer Options</h3>
      <div className="flex items-center space-x-4">
        <Label htmlFor="numDrawers" className="flex-1">
          Number of Duplicate Drawers
        </Label>
        <Input
          id="numDrawers"
          type="number"
          min="1"
          value={numDrawers}
          onChange={handleInputChange}
          onBlur={() => {
            if (numDrawers === "" || isNaN(numDrawers)) {
              setNumDrawers(1);
            }
          }}
          className="w-24"
        />
      </div>
    </div>
  );
};

export default DrawerOptions;
