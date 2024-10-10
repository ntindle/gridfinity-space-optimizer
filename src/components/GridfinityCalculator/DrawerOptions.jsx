import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Drawer Options</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
};

export default DrawerOptions;