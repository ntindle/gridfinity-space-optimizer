import React, { useState, useEffect } from "react";
import { calculateGrids } from "../utils/gridfinityUtils";
import DrawerDimensions from "./GridfinityCalculator/DrawerDimensions";
import PrinterSettings from "./GridfinityCalculator/PrinterSettings";
import BinOptions from "./GridfinityCalculator/BinOptions";
import DrawerOptions from "./GridfinityCalculator/DrawerOptions";
import GridfinityResults from "./GridfinityResults";
import GridfinityVisualPreview from "./GridfinityVisualPreview";

const GridfinityCalculator = () => {
  const [drawerSize, setDrawerSize] = useState({ width: 16.5, height: 22.5 });
  const [printerSize, setPrinterSize] = useState({ x: 256, y: 256 });
  const [useHalfSize, setUseHalfSize] = useState(false);
  const [preferHalfSize, setPreferHalfSize] = useState(false);
  const [result, setResult] = useState(null);
  const [layout, setLayout] = useState([]);
  const [numDrawers, setNumDrawers] = useState(1);

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

  return (
    <div className="space-y-6">
      <DrawerDimensions drawerSize={drawerSize} setDrawerSize={setDrawerSize} />
      <PrinterSettings printerSize={printerSize} setPrinterSize={setPrinterSize} />
      <BinOptions
        useHalfSize={useHalfSize}
        setUseHalfSize={setUseHalfSize}
        preferHalfSize={preferHalfSize}
        setPreferHalfSize={setPreferHalfSize}
      />
      <DrawerOptions numDrawers={numDrawers} setNumDrawers={setNumDrawers} />

      {result && layout.length > 0 && (
        <div className="flex flex-col md:flex-row md:justify-between">
          <GridfinityResults
            result={result}
            useHalfSize={useHalfSize}
            preferHalfSize={preferHalfSize}
          />
          <GridfinityVisualPreview layout={layout} drawerSize={drawerSize} />
        </div>
      )}
    </div>
  );
};

export default GridfinityCalculator;
