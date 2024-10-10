import React, { useState, useEffect } from "react";
import { calculateGrids } from "../utils/gridfinityUtils";
import DrawerDimensions from "./GridfinityCalculator/DrawerDimensions";
import PrinterSettings from "./GridfinityCalculator/PrinterSettings";
import BinOptions from "./GridfinityCalculator/BinOptions";
import DrawerOptions from "./GridfinityCalculator/DrawerOptions";
import GridfinityResults from "./GridfinityResults";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import { saveUserSettings, loadUserSettings, printerSizes } from "../lib/utils";

const GridfinityCalculator = () => {
  const [drawerSize, setDrawerSize] = useState({ width: 22.5, height: 16.5 });
  const [selectedPrinter, setSelectedPrinter] = useState("Bambu Lab A1");
  const [useHalfSize, setUseHalfSize] = useState(false);
  const [preferHalfSize, setPreferHalfSize] = useState(false);
  const [result, setResult] = useState(null);
  const [layout, setLayout] = useState([]);
  const [numDrawers, setNumDrawers] = useState(1);
  const [useMm, setUseMm] = useState(false);

  useEffect(() => {
    const savedSettings = loadUserSettings();
    if (savedSettings) {
      setDrawerSize(savedSettings.drawerSize);
      setSelectedPrinter(savedSettings.selectedPrinter);
      setUseHalfSize(savedSettings.useHalfSize);
      setPreferHalfSize(savedSettings.preferHalfSize);
      setNumDrawers(savedSettings.numDrawers);
      setUseMm(savedSettings.useMm || false);
    }
  }, []);

  useEffect(() => {
    const printerSize = printerSizes[selectedPrinter];
    const { baseplates, spacers, halfSizeBins, layout } = calculateGrids(
      drawerSize,
      printerSize,
      useHalfSize,
      preferHalfSize
    );
    setResult({ baseplates, spacers, halfSizeBins, numDrawers });
    setLayout(layout);

    saveUserSettings({
      drawerSize,
      selectedPrinter,
      useHalfSize,
      preferHalfSize,
      numDrawers,
      useMm,
    });
  }, [
    drawerSize,
    selectedPrinter,
    useHalfSize,
    preferHalfSize,
    numDrawers,
    useMm,
  ]);

  useEffect(() => {
    const logWindowSize = () => {
      console.log(`Window size: ${window.innerWidth}x${window.innerHeight}`);
    };

    logWindowSize();
    window.addEventListener("resize", logWindowSize);

    return () => window.removeEventListener("resize", logWindowSize);
  }, []);

  useEffect(() => {
    const gridContainer = document.querySelector(".grid");
    if (gridContainer) {
      const computedStyle = window.getComputedStyle(gridContainer);
      console.log(
        "Computed grid-template-columns:",
        computedStyle.gridTemplateColumns
      );
    }
  }, []);

  console.log("Rendering GridfinityCalculator");
  console.log(
    "Tailwind classes applied:",
    "grid grid-cols-1 md:grid-cols-2 gap-6"
  );

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
        <div className="bg-white p-4 rounded-lg shadow">
          <DrawerDimensions
            drawerSize={drawerSize}
            setDrawerSize={setDrawerSize}
            useMm={useMm}
            setUseMm={setUseMm}
          />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <PrinterSettings
            selectedPrinter={selectedPrinter}
            setSelectedPrinter={setSelectedPrinter}
          />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <BinOptions
            useHalfSize={useHalfSize}
            setUseHalfSize={setUseHalfSize}
            preferHalfSize={preferHalfSize}
            setPreferHalfSize={setPreferHalfSize}
          />
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <DrawerOptions
            numDrawers={numDrawers}
            setNumDrawers={setNumDrawers}
          />
        </div>
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
          <div className="bg-white p-4 rounded-lg shadow">
            <GridfinityResults
              result={result}
              useHalfSize={useHalfSize}
              preferHalfSize={preferHalfSize}
            />
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <GridfinityVisualPreview layout={layout} drawerSize={drawerSize} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GridfinityCalculator;
