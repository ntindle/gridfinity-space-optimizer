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
    <Card>
      <CardHeader>
        <CardTitle>Drawer Options</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="numDrawers">Number of Duplicate Drawers</Label>
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
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrawerOptions;