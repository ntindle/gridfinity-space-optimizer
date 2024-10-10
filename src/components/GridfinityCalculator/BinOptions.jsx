import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <CardHeader>
        <CardTitle>Bin Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="use-half-size"
              checked={useHalfSize}
              onCheckedChange={(checked) => {
                setUseHalfSize(checked);
                if (checked) setPreferHalfSize(false);
              }}
            />
            <Label htmlFor="use-half-size" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
            <Label htmlFor="prefer-half-size" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Prefer half-size bins for spacers
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BinOptions;
