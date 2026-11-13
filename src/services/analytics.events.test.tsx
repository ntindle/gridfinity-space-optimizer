import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { initAnalytics } from "./analytics";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { useBinHistory } from "@/hooks/useBinHistory";
import SavedLayouts from "@/components/SavedLayouts";
import ShareLayoutButton from "@/components/GridfinityCalculator/ShareLayoutButton";
import DownloadButton from "@/components/GridfinityCalculator/DownloadButton";
import BinLabels from "@/components/BinLabels";
import ThreeDPreview from "@/components/ThreeDPreview";
import {
  SAVED_LAYOUTS_KEY,
  serializeSavedLayouts,
  type SavedLayoutSnapshot,
} from "@/utils/savedLayouts";
import type { Bin, LayoutItem } from "@/types";

const posthog = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn() }));

vi.mock("posthog-js/dist/module.slim", () => ({ default: posthog }));
vi.mock("@/utils/export/exportFiles", () => ({
  createPrintFiles: () => ({
    filename: "gridfinity.zip",
    data: new Uint8Array(),
    parts: 4,
    plates: 2,
    prints: 3,
    skippedBins: 0,
  }),
}));
vi.mock("@/utils/download", () => ({ saveFile: vi.fn(), nextPaint: () => Promise.resolve() }));
vi.mock("@react-three/fiber", () => ({ Canvas: () => null, useThree: () => undefined }));
vi.mock("three-stdlib", () => ({ OrbitControls: class {} }));

const bin = (id: string, label = "Screws"): Bin => ({
  id,
  x: 0,
  y: 0,
  width: 42,
  depth: 42,
  height: 3,
  label,
});

const snapshot = (): SavedLayoutSnapshot => ({
  drawerSize: { width: 15, height: 12 },
  selectedPrinter: "Bambu Lab A1",
  useHalfSize: false,
  preferHalfSize: false,
  preferUniformBaseplates: false,
  numDrawers: 1,
  useMm: false,
  customPrinterSize: { x: 256, y: 256, z: 256 },
  bins: [bin("b1")],
  testFit: false,
  labelTabs: false,
  dividerCount: 0,
  lids: false,
  magnets: false,
  screws: false,
  estimateSettings: { material: "PLA", priceUsdPerKg: 20, flowMm3PerS: 8 },
});

const layout: LayoutItem[] = [
  {
    x: 0,
    y: 0,
    width: 3,
    height: 2,
    type: "baseplate",
    pixelX: 0,
    pixelY: 0,
    pixelWidth: 126,
    pixelHeight: 84,
  },
  {
    x: 0,
    y: 2,
    width: 3,
    height: 0.5,
    type: "spacer",
    pixelX: 0,
    pixelY: 84,
    pixelWidth: 126,
    pixelHeight: 21,
  },
];

const sent = (event: string) =>
  posthog.capture.mock.calls.filter(([name]) => name === event).map(([, properties]) => properties);

const DrawerCountButton = () => {
  const settings = useSettings();
  return (
    <button type="button" onClick={() => settings.setNumDrawers(4)}>
      Four drawers
    </button>
  );
};

beforeAll(async () => {
  const meta = document.createElement("meta");
  meta.name = "posthog-key";
  meta.content = "phc_test";
  document.head.append(meta);
  await initAnalytics();
  window.dispatchEvent(new Event("pointerdown"));
});

beforeEach(() => {
  posthog.capture.mockClear();
});

afterEach(() => {
  vi.mocked(localStorage.getItem).mockReset();
  vi.restoreAllMocks();
});

describe("events sent by each feature", () => {
  it("reports layout changes made through the settings context", async () => {
    render(
      <SettingsProvider>
        <DrawerCountButton />
      </SettingsProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: "Four drawers" }));

    expect(posthog.capture).toHaveBeenCalledWith(
      expect.stringMatching(/^layout_(created|edited)$/),
      { change: "drawer_count" }
    );
  });

  it("reports bins added in the bin editor", () => {
    const first = bin("a");
    const { result } = renderHook(() => useBinHistory([first], vi.fn()));
    act(() => result.current.commit([first, bin("b"), bin("c")]));

    expect(sent("bins_added")).toEqual([{ count: 2, total: 3 }]);
  });

  it("reports saving and loading a layout without its name or bin contents", async () => {
    vi.mocked(localStorage.getItem).mockImplementation((key: string) =>
      key === SAVED_LAYOUTS_KEY
        ? serializeSavedLayouts([
            { id: "s1", name: "Workshop", createdAt: "2026-11-03T12:00:00.000Z", snapshot: snapshot() },
          ])
        : null
    );
    render(<SavedLayouts snapshot={snapshot()} onRestore={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await userEvent.click(screen.getByRole("button", { name: "Load Workshop" }));

    expect(sent("layout_saved")).toEqual([
      expect.objectContaining({ printer: "Bambu Lab A1", drawers: 1, bins: 1 }),
    ]);
    expect(sent("layout_loaded")).toEqual([expect.objectContaining({ source: "saved", bins: 1 })]);
    expect(JSON.stringify(posthog.capture.mock.calls)).not.toMatch(/Workshop|Screws/);
  });

  it("reports a shared layout", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    render(
      <SettingsProvider>
        <ShareLayoutButton />
      </SettingsProvider>
    );
    fireEvent.click(screen.getByRole("button", { name: /copy share link/i }));

    await waitFor(() =>
      expect(sent("layout_shared")).toEqual([
        expect.objectContaining({ printer: "Bambu Lab A1", drawers: 1, bins: 0 }),
      ])
    );
  });

  it("reports downloaded print files with their parts and options", async () => {
    render(
      <DownloadButton
        layout={layout}
        bins={[bin("a")]}
        numDrawers={2}
        drawerSize={{ width: 10, height: 10 }}
        useMm={false}
        printerName="Bambu Lab A1"
        printerSize={{ x: 256, y: 256, z: 256 }}
        testFit={false}
        labelTabs={false}
        dividerCount={1}
        lids={false}
        magnets={true}
        screws={false}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /download files/i }));

    await waitFor(() =>
      expect(sent("files_downloaded")).toEqual([
        expect.objectContaining({
          parts: 4,
          prints: 3,
          drawers: 2,
          baseplates: 2,
          spacers: 2,
          dividers: 1,
          magnets: true,
        }),
      ])
    );
  });

  it("reports printed bin labels", () => {
    vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<BinLabels bins={[bin("a"), bin("b")]} useMm={false} numDrawers={3} />);
    fireEvent.click(screen.getByRole("button", { name: "Print labels" }));

    expect(sent("labels_printed")).toEqual([{ labels: 6, style: "paper" }]);
  });

  it("reports opening the 3D preview", () => {
    render(
      <ThreeDPreview
        layout={layout}
        bins={[]}
        drawerMm={{ width: 126, height: 105 }}
        binGroupKey={new Map()}
        selectedBinId={null}
        selectedKey={null}
        aspectRatio="6 / 5"
        onSelectBin={vi.fn()}
        onSelectPiece={vi.fn()}
      />
    );

    expect(sent("preview_3d_opened")).toEqual([{}]);
  });
});
