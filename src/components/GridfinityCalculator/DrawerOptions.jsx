import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DrawerOptions = ({ numDrawers, setNumDrawers }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Drawer Options</h3>
        <div>
          <Label htmlFor="numDrawers">Number of Duplicate Drawers</Label>
          <Input
            id="numDrawers"
            type="number"
            min="1"
            value={numDrawers}
            onChange={(e) =>
              setNumDrawers(Math.max(1, parseInt(e.target.value) || 1))
            }
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default DrawerOptions;