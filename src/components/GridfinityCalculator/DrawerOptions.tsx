import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DrawerOptions = ({ numDrawers, setNumDrawers }) => {
  const [localValue, setLocalValue] = React.useState(String(numDrawers || 1));
  
  React.useEffect(() => {
    setLocalValue(String(numDrawers || 1));
  }, [numDrawers]);
  
  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow user to type freely
    setLocalValue(value);
    
    // Update actual value if valid
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      setNumDrawers(parsedValue);
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
          type="text"
          inputMode="numeric"
          value={localValue}
          onChange={handleInputChange}
          onBlur={() => {
            // Reset to 1 if invalid
            const parsed = parseInt(localValue, 10);
            if (isNaN(parsed) || parsed < 1) {
              setNumDrawers(1);
              setLocalValue("1");
            }
          }}
          className="w-24"
          placeholder="1"
        />
      </div>
    </div>
  );
};

export default DrawerOptions;
