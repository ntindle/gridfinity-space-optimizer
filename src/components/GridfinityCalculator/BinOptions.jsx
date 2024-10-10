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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bin Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="use-half-size" className="flex-1">
            Use only half-size bins (21x21mm)
          </Label>
          <Switch
            id="use-half-size"
            checked={useHalfSize}
            onCheckedChange={(checked) => {
              setUseHalfSize(checked);
              if (checked) setPreferHalfSize(false);
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="prefer-half-size" className="flex-1">
            Prefer half-size bins for spacers
          </Label>
          <Switch
            id="prefer-half-size"
            checked={preferHalfSize}
            onCheckedChange={(checked) => {
              setPreferHalfSize(checked);
              if (checked) setUseHalfSize(false);
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BinOptions;
