import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DrawerDimensions = ({ drawerSize, setDrawerSize }) => {
  return (
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
              onChange={(e) =>
                setDrawerSize({
                  ...drawerSize,
                  width: parseFloat(e.target.value),
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="drawerHeight">Height (inches)</Label>
            <Input
              id="drawerHeight"
              type="number"
              value={drawerSize.height}
              onChange={(e) =>
                setDrawerSize({
                  ...drawerSize,
                  height: parseFloat(e.target.value),
                })
              }
              className="mt-1"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DrawerDimensions;
