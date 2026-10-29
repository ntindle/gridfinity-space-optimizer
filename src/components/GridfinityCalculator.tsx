import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Compass } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import DrawerDimensions from "./GridfinityCalculator/DrawerDimensions";
import PrinterSettings from "./GridfinityCalculator/PrinterSettings";
import BinOptions from "./GridfinityCalculator/BinOptions";
import DrawerOptions from "./GridfinityCalculator/DrawerOptions";
import GridfinityResults from "./GridfinityResults";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import PrintPlanCard from "./PrintPlanCard";
import BinLabels from "./BinLabels";
import { formatDrawerSize } from "@/utils/format";
import { useSettings } from "@/contexts/SettingsContext";
import { useGridfinityCalculation } from "@/hooks/useGridfinityCalculation";
import { saveUserSettings, loadUserSettings } from "@/lib/utils";
import { parseShareParam } from "@/utils/shareLayout";
import ShareLayoutButton from "@/components/GridfinityCalculator/ShareLayoutButton";
import DownloadButton from "@/components/GridfinityCalculator/DownloadButton";
import { binIssues, gridCells, indexCells, maxBinHeight } from "@/utils/bins";
import { usableBed } from "@/utils/printPlan";
import GuidedTour from "@/components/GuidedTour";
import CollapsibleCard from "@/components/CollapsibleCard";
import MobileResultsBar from "@/components/MobileResultsBar";

const GridfinityCalculator: React.FC = () => {
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
      settings.setBins(shared.bins);
      toast.success("Opened a shared layout", {
        description: "It replaces the layout saved on this device.",
      });
    } else {
      toast.error("That share link couldn't be opened", {
        description: "It may be incomplete. Showing the layout saved on this device.",
      });
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

  const hasLayout = Boolean(result) && layout.length > 0;
  const placedBins = useMemo(() => {
    const issues = binIssues(settings.bins, indexCells(gridCells(layout)), {
      ...usableBed(printerSize),
      height: maxBinHeight(printerSize.z),
    });
    return settings.bins.filter((bin) => !issues.has(bin.id));
  }, [layout, printerSize, settings.bins]);
  const drawerEntered = settings.drawerSize.width > 0 && settings.drawerSize.height > 0;

  const drawerSummary = `${formatDrawerSize(settings.drawerSize, settings.useMm)}${
    settings.numDrawers > 1 ? ` · ×${settings.numDrawers}` : ""
  }`;
  const binSummary =
    [
      settings.useHalfSize && "Half-size grid",
      settings.preferHalfSize && "Half-size gaps",
      settings.preferUniformBaseplates && !settings.useHalfSize && "Uniform",
    ]
      .filter(Boolean)
      .join(" · ") || "Standard";

  return (
    <div className="mx-auto grid w-full max-w-[1320px] gap-x-8 gap-y-6 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] lg:pt-10">
      <aside className="min-w-0">
        <div className="max-w-[44ch]">
          <h1 className="text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.025em] text-balance sm:text-[2rem]">
            Plan a Gridfinity layout for any drawer
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">
            Enter the inside of your drawer and pick your printer, then lay out
            your bins. Download every bin, baseplate, and spacer to print, and
            the labels to go with them.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setTourOpen(true)}
          >
            <Compass />
            Take the tour
          </Button>
        </div>

        <div className="mt-6 lg:sticky lg:top-6">
          <Card className="md:grid md:grid-cols-2 lg:block lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain">
            <h2 className="sr-only">Settings</h2>
            <CollapsibleCard
              title="Drawer"
              summary={drawerSummary}
              tourId="drawer"
              action={
                <SegmentedControl
                  aria-label="Units"
                  value={settings.useMm ? "mm" : "in"}
                  onValueChange={(value) => settings.setUseMm(value === "mm")}
                  options={[
                    { value: "in", label: "in", srLabel: "inches" },
                    { value: "mm", label: "mm", srLabel: "millimeters" },
                  ]}
                />
              }
              className="md:row-span-2 md:border-r lg:border-r-0"
            >
              <DrawerDimensions
                drawerSize={settings.drawerSize}
                setDrawerSize={settings.setDrawerSize}
                useMm={settings.useMm}
              />
              <div className="mt-4 border-t border-border/70 pt-4">
                <DrawerOptions
                  numDrawers={settings.numDrawers}
                  setNumDrawers={settings.setNumDrawers}
                />
              </div>
            </CollapsibleCard>

            <CollapsibleCard
              title="Printer"
              summary={settings.selectedPrinter}
              defaultOpen={false}
              tourId="printer"
              className="border-t md:border-t-0 lg:border-t"
            >
              <PrinterSettings
                selectedPrinter={settings.selectedPrinter}
                setSelectedPrinter={settings.setSelectedPrinter}
                printerSize={printerSize}
                setPrinterSize={settings.setCustomPrinterSize}
                customPrinterSize={settings.customPrinterSize}
                useMm={settings.useMm}
                useHalfSize={settings.useHalfSize}
              />
            </CollapsibleCard>

            <CollapsibleCard
              title="Grid"
              summary={binSummary}
              defaultOpen={false}
              tourId="grid"
              className="border-t"
            >
              <BinOptions
                useHalfSize={settings.useHalfSize}
                setUseHalfSize={settings.setUseHalfSize}
                preferHalfSize={settings.preferHalfSize}
                setPreferHalfSize={settings.setPreferHalfSize}
                preferUniformBaseplates={settings.preferUniformBaseplates}
                setPreferUniformBaseplates={settings.setPreferUniformBaseplates}
                labelTabs={settings.labelTabs}
                setLabelTabs={settings.setLabelTabs}
              />
            </CollapsibleCard>
          </Card>
        </div>

        {hasLayout && result && (
          <MobileResultsBar result={result} binCount={placedBins.length} />
        )}
      </aside>

      <div className="min-w-0 space-y-6">
        {hasLayout && result ? (
          <>
            <Card className="p-5 sm:p-6">
              <GridfinityResults
                result={result}
                useMm={settings.useMm}
                binCount={placedBins.length}
                drawerSize={settings.drawerSize}
                action={
                  <div className="flex flex-wrap items-start gap-2">
                    <DownloadButton
                      layout={layout}
                      bins={settings.bins}
                      numDrawers={settings.numDrawers}
                      drawerSize={settings.drawerSize}
                      useMm={settings.useMm}
                      printerName={
                        settings.selectedPrinter === "Custom Printer"
                          ? "custom printer"
                          : settings.selectedPrinter
                      }
                      printerSize={printerSize}
                      testFit={settings.testFit}
                      labelTabs={settings.labelTabs}
                    />
                    <ShareLayoutButton />
                  </div>
                }
              />
              <div className="mt-6">
                <GridfinityVisualPreview
                  layout={layout}
                  drawerSize={settings.drawerSize}
                  useMm={settings.useMm}
                  numDrawers={settings.numDrawers}
                  bins={settings.bins}
                  onBinsChange={settings.setBins}
                  printerSize={printerSize}
                />
              </div>
            </Card>
            <PrintPlanCard
              layout={layout}
              bins={settings.bins}
              numDrawers={settings.numDrawers}
              useMm={settings.useMm}
              printerName={
                settings.selectedPrinter === "Custom Printer"
                  ? "custom printer"
                  : settings.selectedPrinter
              }
              printerSize={printerSize}
              testFit={settings.testFit}
              onTestFitChange={settings.setTestFit}
              labelTabs={settings.labelTabs}
              estimateSettings={settings.estimateSettings}
              onEstimateSettingsChange={settings.setEstimateSettings}
            />
            <BinLabels
              bins={placedBins}
              useMm={settings.useMm}
              numDrawers={settings.numDrawers}
            />
          </>
        ) : (
          <Card className="grid min-h-80 place-items-center px-6 py-12 text-center">
            <div className="max-w-sm">
              <div
                aria-hidden="true"
                className="drawer-floor mx-auto grid size-14 grid-cols-2 gap-1 rounded-md p-1.5"
              >
                <span className="piece piece-plate" style={{ "--cell-w": "100%", "--cell-h": "100%" } as React.CSSProperties} />
                <span className="piece piece-spacer" />
                <span className="piece piece-spacer" />
                <span className="piece piece-plate" style={{ "--cell-w": "100%", "--cell-h": "100%" } as React.CSSProperties} />
              </div>
              <h2 className="mt-5 text-base font-semibold tracking-[-0.01em]">
                {drawerEntered ? "Your printer bed is too small" : "Enter your drawer size"}
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
                {drawerEntered
                  ? "After its exclusion zones, the bed can't fit a single grid cell. Edit the custom printer's size or zones."
                  : "Add the inside width and depth of your drawer to see the layout, the parts to print, and the labels."}
              </p>
            </div>
          </Card>
        )}
      </div>
      <GuidedTour open={tourOpen} onClose={closeTour} />
    </div>
  );
};

export default GridfinityCalculator;
