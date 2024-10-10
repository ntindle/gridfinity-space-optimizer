import React from "react";
import { getColor, INCH_TO_MM } from "../utils/gridfinityUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const GridfinityVisualPreview = ({ layout, drawerSize }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4 w-full md:w-1/2">
          <h3 className="text-lg font-semibold mb-4">Visual Preview:</h3>
          <div
            className="w-full relative border-2 border-black overflow-hidden"
            style={{
              paddingBottom: `${(drawerSize.height / drawerSize.width) * 100}%`,
            }}
          >
            <div className="absolute inset-0">
              {layout.map((item, index) => (
                <div
                  key={index}
                  className="absolute flex items-center justify-center border border-black text-xs md:text-sm overflow-hidden whitespace-nowrap"
                  style={{
                    left: `${
                      (item.pixelX / INCH_TO_MM / drawerSize.width) * 100
                    }%`,
                    top: `${
                      (item.pixelY / INCH_TO_MM / drawerSize.height) * 100
                    }%`,
                    width: `${
                      (item.pixelWidth / INCH_TO_MM / drawerSize.width) * 100
                    }%`,
                    height: `${
                      (item.pixelHeight / INCH_TO_MM / drawerSize.height) * 100
                    }%`,
                    backgroundColor: getColor(item.type, index),
                  }}
                >
                  {item.type === "baseplate" || item.type === "half-size"
                    ? `${item.width}x${item.height}`
                    : "Spacer"}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GridfinityVisualPreview;
