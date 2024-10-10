import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const BinOptions = ({
  useHalfSize,
  setUseHalfSize,
  preferHalfSize,
  setPreferHalfSize,
}) => {
  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">Bin Options</h3>
      <div className="space-y-4">
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
      </div>
    </div>
  );
};

export default BinOptions;
