import { describe, expect, it } from "vitest";
import {
  LAYOUT_FILE_MAX_BYTES,
  layoutFileName,
  parseLayoutFile,
  serializeLayoutFile,
} from "./layoutFile";
import type { SavedLayoutSnapshot } from "./savedLayouts";

const snapshot = (): SavedLayoutSnapshot => ({
  drawerSize: { width: 15, height: 12 },
  selectedPrinter: "Bambu Lab A1",
  useHalfSize: true,
  preferHalfSize: false,
  preferUniformBaseplates: false,
  numDrawers: 1,
  useMm: false,
  customPrinterSize: { x: 256, y: 256, z: 256 },
  bins: [{ id: "b1", x: 0, y: 0, width: 2, depth: 1, height: 3, label: "Screws" }],
  obstacles: [{ id: "o1", x: 42, y: 0, width: 84, depth: 42 }],
  testFit: false,
  labelTabs: false,
  dividerCount: 0,
  lids: false,
  magnets: false,
  screws: false,
  scoop: false,
  vaseMode: false,
  connectors: false,
  stackBins: false,
  spacerless: true,
  estimateSettings: { material: "PLA", priceUsdPerKg: 20, flowMm3PerS: 8 },
});

const fileText = (overrides: Record<string, unknown> = {}): string =>
  JSON.stringify({
    format: "gridfinitylayout",
    version: 1,
    name: "Workshop",
    exportedAt: "2026-11-27T12:00:00.000Z",
    snapshot: snapshot(),
    ...overrides,
  });

describe("layoutFile", () => {
  it("round-trips a snapshot with its name", () => {
    const parsed = parseLayoutFile(serializeLayoutFile(snapshot(), "Workshop"));
    expect(parsed).toEqual({ name: "Workshop", snapshot: snapshot() });
  });

  it("rejects garbage JSON", () => {
    expect(parseLayoutFile("not json")).toBeNull();
  });

  it("rejects non-object JSON", () => {
    expect(parseLayoutFile("[]")).toBeNull();
    expect(parseLayoutFile("42")).toBeNull();
    expect(parseLayoutFile("null")).toBeNull();
  });

  it("rejects the wrong format", () => {
    expect(parseLayoutFile(fileText({ format: "other" }))).toBeNull();
  });

  it("rejects an unsupported version", () => {
    expect(parseLayoutFile(fileText({ version: 2 }))).toBeNull();
  });

  it("rejects an oversize file", () => {
    expect(parseLayoutFile("x".repeat(LAYOUT_FILE_MAX_BYTES + 1))).toBeNull();
  });

  it("rejects an invalid snapshot", () => {
    expect(parseLayoutFile(fileText({ snapshot: { bins: [] } }))).toBeNull();
  });

  it("sanitizes a legacy snapshot missing newer fields with defaults", () => {
    const legacy = { ...snapshot() } as Record<string, unknown>;
    delete legacy.obstacles;
    delete legacy.magnets;
    delete legacy.screws;
    delete legacy.scoop;
    delete legacy.vaseMode;
    delete legacy.connectors;
    delete legacy.stackBins;
    delete legacy.spacerless;
    delete legacy.estimateSettings;
    const parsed = parseLayoutFile(fileText({ snapshot: legacy }));
    expect(parsed?.snapshot.obstacles).toEqual([]);
    expect(parsed?.snapshot.magnets).toBe(false);
    expect(parsed?.snapshot.spacerless).toBe(false);
    expect(parsed?.snapshot.estimateSettings.material).toBe("PLA");
  });

  it("sanitizes tampered bins and obstacles instead of crashing", () => {
    const tampered = {
      ...snapshot(),
      bins: [
        { id: "good", x: 0, y: 0, width: 2, depth: 1, height: 3, label: "Good" },
        { id: "bad", x: -1, y: 0, width: 0, depth: 1, height: 3, label: "Bad" },
        "junk",
      ],
      obstacles: [
        { id: "o1", x: 42, y: 0, width: 84, depth: 42 },
        { id: "bad", x: -5, y: 0, width: 42, depth: 42 },
      ],
    };
    const parsed = parseLayoutFile(fileText({ snapshot: tampered }));
    expect(parsed?.snapshot.bins.map((bin) => bin.label)).toEqual(["Good"]);
    expect(parsed?.snapshot.obstacles).toEqual([
      { id: "o1", x: 42, y: 0, width: 84, depth: 42 },
    ]);
  });

  it("drops vase mode when scoop and vase mode are both on", () => {
    const parsed = parseLayoutFile(
      fileText({ snapshot: { ...snapshot(), scoop: true, vaseMode: true } })
    );
    expect(parsed?.snapshot.scoop).toBe(true);
    expect(parsed?.snapshot.vaseMode).toBe(false);
  });

  it("falls back to a drawer-size name when the file name is missing", () => {
    const parsed = parseLayoutFile(fileText({ name: "" }));
    expect(parsed?.name).toBe("15 × 12 in layout");
  });

  it("clamps an oversize drawer to the share-link bound", () => {
    const parsed = parseLayoutFile(
      fileText({ snapshot: { ...snapshot(), drawerSize: { width: 1e9, height: 12 } } })
    );
    expect(parsed?.snapshot.drawerSize).toEqual({ width: 200, height: 12 });
  });

  it("rejects a non-positive drawer size", () => {
    expect(
      parseLayoutFile(
        fileText({ snapshot: { ...snapshot(), drawerSize: { width: 0, height: 12 } } })
      )
    ).toBeNull();
    expect(
      parseLayoutFile(
        fileText({ snapshot: { ...snapshot(), drawerSize: { width: 15, height: -3 } } })
      )
    ).toBeNull();
  });

  it("drops extra keys from the drawer size", () => {
    const parsed = parseLayoutFile(
      fileText({
        snapshot: { ...snapshot(), drawerSize: { width: 15, height: 12, depth: 9 } },
      })
    );
    expect(parsed?.snapshot.drawerSize).toEqual({ width: 15, height: 12 });
  });

  it("normalizes numDrawers to an integer in 1-100", () => {
    const drawersFor = (numDrawers: number) =>
      parseLayoutFile(fileText({ snapshot: { ...snapshot(), numDrawers } }))?.snapshot
        .numDrawers;
    expect(drawersFor(-3)).toBe(1);
    expect(drawersFor(1.5)).toBe(2);
    expect(drawersFor(1e9)).toBe(100);
    expect(drawersFor(3)).toBe(3);
  });

  it("clamps huge printer dimensions and rejects non-positive ones", () => {
    const parsed = parseLayoutFile(
      fileText({
        snapshot: { ...snapshot(), customPrinterSize: { x: 1e9, y: 256, z: 256 } },
      })
    );
    expect(parsed?.snapshot.customPrinterSize).toEqual({ x: 2000, y: 256, z: 256 });
    expect(
      parseLayoutFile(
        fileText({
          snapshot: { ...snapshot(), customPrinterSize: { x: -1, y: 0, z: 1e9 } },
        })
      )
    ).toBeNull();
  });

  it("caps the bin count at the share-link bound", () => {
    const bins = Array.from({ length: 20000 }, () => ({
      x: 0,
      y: 0,
      width: 42,
      depth: 42,
    }));
    const parsed = parseLayoutFile(fileText({ snapshot: { ...snapshot(), bins } }));
    expect(parsed?.snapshot.bins).toHaveLength(1000);
  });

  it("drops bins with absurd dimensions or positions", () => {
    const parsed = parseLayoutFile(
      fileText({
        snapshot: {
          ...snapshot(),
          bins: [
            { id: "good", x: 0, y: 0, width: 42, depth: 42, height: 3, label: "Good" },
            { id: "wide", x: 0, y: 0, width: 1000000, depth: 0.5, height: 3, label: "Wide" },
            { id: "far", x: 1e9, y: 0, width: 42, depth: 42, height: 3, label: "Far" },
            { id: "tall", x: 42, y: 0, width: 42, depth: 42, height: 1e9, label: "Tall" },
          ],
        },
      })
    );
    expect(parsed?.snapshot.bins.map((bin) => bin.label)).toEqual(["Good", "Tall"]);
    expect(parsed?.snapshot.bins[1].height).toBe(20);
  });

  it("clears preferHalfSize when useHalfSize is on", () => {
    const parsed = parseLayoutFile(
      fileText({ snapshot: { ...snapshot(), useHalfSize: true, preferHalfSize: true } })
    );
    expect(parsed?.snapshot.useHalfSize).toBe(true);
    expect(parsed?.snapshot.preferHalfSize).toBe(false);
  });

  it("slugifies the download filename", () => {
    expect(layoutFileName("Workshop Drawer!")).toBe("workshop-drawer.json");
    expect(layoutFileName("15 × 12 in layout")).toBe("15x12in-layout.json");
    expect(layoutFileName("!!!")).toBe("gridfinity-layout.json");
  });
});
