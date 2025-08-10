import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import DrawerDimensions from "./GridfinityCalculator/DrawerDimensions";
import PrinterSettings from "./GridfinityCalculator/PrinterSettings";
import BinOptions from "./GridfinityCalculator/BinOptions";
import DrawerOptions from "./GridfinityCalculator/DrawerOptions";
import GridfinityResults from "./GridfinityResults";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import { useGridfinitySettings } from "../hooks/useGridfinitySettings";
import { useGridfinityCalculation } from "../hooks/useGridfinityCalculation";
import { useLegacyMigration } from "../hooks/useLegacyMigration";
import { saveUserSettings, loadUserSettings } from "../lib/utils";

const GridfinityCalculator = () => {
  // Migrate legacy data first
  useLegacyMigration();
  
  // Use our custom hooks for clean state management
  const settings = useGridfinitySettings();
  
  // Calculate results based on current settings
  const { result, layout, printerSize } = useGridfinityCalculation({
    drawerSize: settings.drawerSize,
    selectedPrinter: settings.selectedPrinter,
    useHalfSize: settings.useHalfSize,
    preferHalfSize: settings.preferHalfSize,
    numDrawers: settings.numDrawers,
  });
  
  // Maintain backward compatibility with tests by syncing with old format
  useEffect(() => {
    // Load legacy settings on mount for test compatibility
    const legacySettings = loadUserSettings();
    if (legacySettings && !localStorage.getItem('gridfinity_migration_v1')) {
      // Apply legacy settings if they exist and haven't been migrated
      if (legacySettings.drawerSize) settings.setDrawerSize(legacySettings.drawerSize);
      if (legacySettings.selectedPrinter) settings.setSelectedPrinter(legacySettings.selectedPrinter);
      if (legacySettings.useHalfSize !== undefined) settings.setUseHalfSize(legacySettings.useHalfSize);
      if (legacySettings.preferHalfSize !== undefined) settings.setPreferHalfSize(legacySettings.preferHalfSize);
      if (legacySettings.numDrawers !== undefined) settings.setNumDrawers(legacySettings.numDrawers);
      if (legacySettings.useMm !== undefined) settings.setUseMm(legacySettings.useMm);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Save in legacy format for test compatibility
  useEffect(() => {
    saveUserSettings({
      drawerSize: settings.drawerSize,
      selectedPrinter: settings.selectedPrinter,
      useHalfSize: settings.useHalfSize,
      preferHalfSize: settings.preferHalfSize,
      numDrawers: settings.numDrawers,
      useMm: settings.useMm,
    });
  }, [
    settings.drawerSize,
    settings.selectedPrinter,
    settings.useHalfSize,
    settings.preferHalfSize,
    settings.numDrawers,
    settings.useMm,
  ]);

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
              drawerSize={settings.drawerSize}
              setDrawerSize={settings.setDrawerSize}
              useMm={settings.useMm}
              setUseMm={settings.setUseMm}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <PrinterSettings
              selectedPrinter={settings.selectedPrinter}
              setSelectedPrinter={settings.setSelectedPrinter}
              printerSize={printerSize}
              useMm={settings.useMm}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <BinOptions
              useHalfSize={settings.useHalfSize}
              setUseHalfSize={settings.setUseHalfSize}
              preferHalfSize={settings.preferHalfSize}
              setPreferHalfSize={settings.setPreferHalfSize}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <DrawerOptions
              numDrawers={settings.numDrawers}
              setNumDrawers={settings.setNumDrawers}
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
                useHalfSize={settings.useHalfSize}
                preferHalfSize={settings.preferHalfSize}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <GridfinityVisualPreview 
                layout={layout} 
                drawerSize={settings.drawerSize} 
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GridfinityCalculator;