import React, { useCallback, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import DrawerDimensions from "./GridfinityCalculator/DrawerDimensions";
import PrinterSettings from "./GridfinityCalculator/PrinterSettings";
import BinOptions from "./GridfinityCalculator/BinOptions";
import DrawerOptions from "./GridfinityCalculator/DrawerOptions";
import GridfinityResults from "./GridfinityResults";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import BinLabels from "./BinLabels";
import { pruneBinContents } from "@/utils/binContents";
import { useSettings } from "@/contexts/SettingsContext";
import { useGridfinityCalculation } from "@/hooks/useGridfinityCalculation";
import { useLegacyMigration } from "@/hooks/useLegacyMigration";
import { saveUserSettings, loadUserSettings } from "@/lib/utils";
import { parseShareParam } from "@/utils/shareLayout";
import ShareLayoutButton from "@/components/GridfinityCalculator/ShareLayoutButton";
import GuidedTour from "@/components/GuidedTour";
import CollapsibleCard from "@/components/CollapsibleCard";
import MobileResultsBar from "@/components/MobileResultsBar";

const GridfinityCalculator: React.FC = () => {
  useLegacyMigration();

  const [tourOpen, setTourOpen] = useState(false);
  const closeTour = useCallback(() => setTourOpen(false), []);
  
  const settings = useSettings();
  
  const { result, layout, printerSize } = useGridfinityCalculation({
    drawerSize: settings.drawerSize,
    selectedPrinter: settings.selectedPrinter,
    customPrinterSize: settings.customPrinterSize,
    useHalfSize: settings.useHalfSize,
    preferHalfSize: settings.preferHalfSize,
    preferUniformBaseplates: settings.preferUniformBaseplates,
    numDrawers: settings.numDrawers,
  });

  useEffect(() => {
    const pruned = pruneBinContents(settings.binContents, layout);
    if (Object.keys(pruned).length !== Object.keys(settings.binContents).length) {
      settings.setBinContents(pruned);
    }
  }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    const legacySettings = loadUserSettings();
    if (legacySettings && !localStorage.getItem('gridfinity_migration_v1')) {
      if (legacySettings.drawerSize) settings.setDrawerSize(legacySettings.drawerSize);
      if (legacySettings.selectedPrinter) settings.setSelectedPrinter(legacySettings.selectedPrinter);
      if (legacySettings.useHalfSize !== undefined) settings.setUseHalfSize(legacySettings.useHalfSize);
      if (legacySettings.preferHalfSize !== undefined) settings.setPreferHalfSize(legacySettings.preferHalfSize);
      if (legacySettings.numDrawers !== undefined) settings.setNumDrawers(legacySettings.numDrawers);
      if (legacySettings.useMm !== undefined) settings.setUseMm(legacySettings.useMm);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('share')) return;
    const shared = parseShareParam(window.location.search);
    if (shared) {
      settings.setDrawerSize(shared.drawerSize);
      settings.setSelectedPrinter(shared.selectedPrinter);
      if (shared.customPrinterSize) {
        settings.setCustomPrinterSize(shared.customPrinterSize);
      }
      settings.setUseHalfSize(shared.useHalfSize);
      settings.setPreferHalfSize(shared.preferHalfSize);
      settings.setPreferUniformBaseplates(shared.preferUniformBaseplates);
      settings.setNumDrawers(shared.numDrawers);
      settings.setUseMm(shared.useMm);
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('share');
    window.history.replaceState(null, '', url.toString());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
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
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">New here?</span>
        <Button variant="outline" size="sm" onClick={() => setTourOpen(true)}>
          Take the tour
        </Button>
      </div>
      <div
        className="grid gap-6 max-w-full max-md:[&_input]:h-11"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gridAutoRows: "1fr",
        }}
      >
        <CollapsibleCard title="Drawer Dimensions" tourId="drawer">
          <DrawerDimensions
            drawerSize={settings.drawerSize}
            setDrawerSize={settings.setDrawerSize}
            useMm={settings.useMm}
            setUseMm={settings.setUseMm}
          />
        </CollapsibleCard>

        <CollapsibleCard title="Printer Settings" defaultOpen={false} tourId="printer">
          <PrinterSettings
            selectedPrinter={settings.selectedPrinter}
            setSelectedPrinter={settings.setSelectedPrinter}
            printerSize={printerSize}
            setPrinterSize={settings.setCustomPrinterSize}
            useMm={settings.useMm}
          />
        </CollapsibleCard>

        <CollapsibleCard title="Bin Options" defaultOpen={false} tourId="bins">
          <BinOptions
            useHalfSize={settings.useHalfSize}
            setUseHalfSize={settings.setUseHalfSize}
            preferHalfSize={settings.preferHalfSize}
            setPreferHalfSize={settings.setPreferHalfSize}
            preferUniformBaseplates={settings.preferUniformBaseplates}
            setPreferUniformBaseplates={settings.setPreferUniformBaseplates}
          />
        </CollapsibleCard>

        <CollapsibleCard title="Drawer Options" defaultOpen={false}>
          <DrawerOptions
            numDrawers={settings.numDrawers}
            setNumDrawers={settings.setNumDrawers}
          />
        </CollapsibleCard>
      </div>

      {result && <MobileResultsBar result={result} />}

      <ShareLayoutButton />

      {result && (
        <>
          <GridfinityResults
            result={result}
            useMm={settings.useMm}
            useHalfSize={settings.useHalfSize}
            preferHalfSize={settings.preferHalfSize}
          />
          {layout && layout.length > 0 && (
            <GridfinityVisualPreview
              layout={layout}
              drawerSize={settings.drawerSize}
              useMm={settings.useMm}
              binContents={settings.binContents}
              onBinContentsChange={settings.setBinContents}
            />
          )}
          {layout && layout.length > 0 && (
            <BinLabels
              layout={layout}
              useMm={settings.useMm}
              numDrawers={settings.numDrawers}
              binContents={settings.binContents}
            />
          )}
        </>
      )}
      <GuidedTour open={tourOpen} onClose={closeTour} />
    </div>
  );
};

export default GridfinityCalculator;