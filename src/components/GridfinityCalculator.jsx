import React, { useState, useEffect } from "react";
import { calculateGrids } from "../utils/gridfinityUtils";
import DrawerDimensions from "./GridfinityCalculator/DrawerDimensions";
import PrinterSettings from "./GridfinityCalculator/PrinterSettings";
import BinOptions from "./GridfinityCalculator/BinOptions";
import DrawerOptions from "./GridfinityCalculator/DrawerOptions";
import GridfinityResults from "./GridfinityResults";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import { Card, CardContent } from "@/components/ui/card";
import { printerSizes } from "@/lib/utils";

const GridfinityCalculator = () => {
  const [drawerSize, setDrawerSize] = useState({ width: 571.5, height: 419.1 }); // Default in mm
  const [printerSize, setPrinterSize] = useState({ x: 256, y: 256 });
  const [selectedPrinter, setSelectedPrinter] = useState("Bambu Lab A1");
  const [useHalfSize, setUseHalfSize] = useState(false);
  const [preferHalfSize, setPreferHalfSize] = useState(false);
  const [result, setResult] = useState(null);
  const [layout, setLayout] = useState([]);
  const [numDrawers, setNumDrawers] = useState(1);
  const [unit, setUnit] = useState('in'); // Default to inches

  useEffect(() => {
    const { baseplates, spacers, halfSizeBins, layout } = calculateGrids(
      drawerSize,
      printerSize,
      useHalfSize,
      preferHalfSize
    );
    setResult({ baseplates, spacers, halfSizeBins, numDrawers });
    setLayout(layout);
  }, [drawerSize, printerSize, useHalfSize, preferHalfSize, numDrawers]);

  const handlePrinterChange = (value) => {
    setSelectedPrinter(value);
    if (value === "custom") {
      // For now, we'll set a default custom size
      // This can be expanded later to allow user input
      setPrinterSize({ x: 200, y: 200 });
    } else {
      setPrinterSize(printerSizes[value]);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="grid gap-6 max-w-full"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gridAutoRows: "1fr",
        }}
      >
        <Card>
          <CardContent>
            <DrawerDimensions
              drawerSize={drawerSize}
              setDrawerSize={setDrawerSize}
              unit={unit}
              setUnit={setUnit}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <PrinterSettings
              selectedPrinter={selectedPrinter}
              handlePrinterChange={handlePrinterChange}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <BinOptions
              useHalfSize={useHalfSize}
              setUseHalfSize={setUseHalfSize}
              preferHalfSize={preferHalfSize}
              setPreferHalfSize={setPreferHalfSize}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <DrawerOptions
              numDrawers={numDrawers}
              setNumDrawers={setNumDrawers}
            />
          </CardContent>
        </Card>
      </div>

      {result && layout.length > 0 && (
        <div
          className="grid gap-6 max-w-full"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gridAutoRows: "1fr",
          }}
        >
          <Card>
            <CardContent>
              <GridfinityResults
                result={result}
                useHalfSize={useHalfSize}
                preferHalfSize={preferHalfSize}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <GridfinityVisualPreview layout={layout} drawerSize={drawerSize} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GridfinityCalculator;