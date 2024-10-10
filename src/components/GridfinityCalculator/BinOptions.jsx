import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BinOptions = ({
  useHalfSize,
  setUseHalfSize,
  preferHalfSize,
  setPreferHalfSize,
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">Bin Options</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-half-size"
              checked={useHalfSize}
              onCheckedChange={(checked) => {
                setUseHalfSize(checked);
                if (checked) setPreferHalfSize(false);
              }}
            />
            <Label htmlFor="use-half-size">
              Use only half-size bins (21x21mm)
            </Label>
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
            <Label htmlFor="prefer-half-size">
              Prefer half-size bins for spacers
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BinOptions;
