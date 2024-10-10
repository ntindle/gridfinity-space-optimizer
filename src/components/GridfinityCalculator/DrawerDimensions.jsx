import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DrawerDimensions = ({ drawerSize, setDrawerSize }) => {
  return (
    <div className="w-full max-w-sm">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Drawer Dimensions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="drawerWidth">Width (inches)</Label>
              <Input
                id="drawerWidth"
                type="number"
                value={drawerSize.width}
                onChange={(e) =>
                  setDrawerSize({
                    ...drawerSize,
                    width: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="drawerHeight">Height (inches)</Label>
              <Input
                id="drawerHeight"
                type="number"
                value={drawerSize.height}
                onChange={(e) =>
                  setDrawerSize({
                    ...drawerSize,
                    height: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DrawerDimensions;
