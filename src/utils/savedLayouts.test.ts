import { describe, expect, it } from "vitest";
import {
  createSavedLayoutId,
  defaultSavedLayoutName,
  parseSavedLayouts,
  removeSavedLayout,
  serializeSavedLayouts,
  upsertSavedLayout,
  type SavedLayout,
  type SavedLayoutSnapshot,
} from "./savedLayouts";

const snapshot = (): SavedLayoutSnapshot => ({
  drawerSize: { width: 15, height: 12 },
  selectedPrinter: "Bambu Lab A1",
  useHalfSize: false,
  preferHalfSize: false,
  preferUniformBaseplates: false,
  numDrawers: 1,
  useMm: false,
  customPrinterSize: { x: 256, y: 256, z: 256 },
  bins: [{ id: "b1", x: 0, y: 0, width: 2, depth: 1, height: 3, label: "Screws" }],
  testFit: false,
  labelTabs: false,
  dividerCount: 0,
  lids: false,
  estimateSettings: { material: "PLA", priceUsdPerKg: 20, flowMm3PerS: 8 },
});

const entry = (overrides: Partial<SavedLayout> = {}): SavedLayout => ({
  id: "s1",
  name: "Workshop",
  createdAt: "2026-11-03T12:00:00.000Z",
  snapshot: snapshot(),
  ...overrides,
});

describe("parseSavedLayouts", () => {
  it("returns an empty list for missing or corrupt input", () => {
    expect(parseSavedLayouts(null)).toEqual([]);
    expect(parseSavedLayouts("not json")).toEqual([]);
    expect(parseSavedLayouts("[]")).toEqual([]);
    expect(parseSavedLayouts("{}")).toEqual([]);
  });

  it("round-trips through serialize", () => {
    const layouts = [entry()];
    expect(parseSavedLayouts(serializeSavedLayouts(layouts))).toEqual(layouts);
  });

  it("drops malformed entries and keeps valid ones", () => {
    const raw = JSON.stringify([
      entry(),
      { id: "bad", name: "Bad", createdAt: "2026-11-03T12:00:00.000Z" },
      entry({ id: "s2", name: "Second", createdAt: "not a date" }),
      entry({
        id: "s3",
        name: "Third",
        snapshot: {
          ...snapshot(),
          drawerSize: { width: "wide", height: 12 },
        } as unknown as SavedLayoutSnapshot,
      }),
    ]);
    expect(parseSavedLayouts(raw).map((layout) => layout.name)).toEqual(["Workshop"]);
  });

  it("keeps valid exclusion zones and strips invalid ones on parse", () => {
    const raw = JSON.stringify([
      entry({
        snapshot: {
          ...snapshot(),
          customPrinterSize: {
            x: 256,
            y: 256,
            z: 256,
            exclusionZone: { front: 10, left: "wide", back: -5, right: 2000 },
          },
        } as unknown as SavedLayoutSnapshot,
      }),
      entry({
        id: "s2",
        name: "Zoned",
        snapshot: {
          ...snapshot(),
          customPrinterSize: {
            x: 256,
            y: 256,
            z: 256,
            exclusionZone: { front: 10, back: 20 },
          },
        } as unknown as SavedLayoutSnapshot,
      }),
      entry({
        id: "s3",
        name: "Unzoned",
        snapshot: {
          ...snapshot(),
          customPrinterSize: { x: 256, y: 256, z: 256, exclusionZone: "wide" },
        } as unknown as SavedLayoutSnapshot,
      }),
    ]);
    const parsed = parseSavedLayouts(raw);
    expect(parsed).toHaveLength(3);
    expect(parsed[0].snapshot.customPrinterSize.exclusionZone).toEqual({ front: 10 });
    expect(parsed[1].snapshot.customPrinterSize.exclusionZone).toEqual({
      front: 10,
      back: 20,
    });
    expect(parsed[2].snapshot.customPrinterSize.exclusionZone).toBeUndefined();
  });

  it("sanitizes bins and estimate settings on parse", () => {    const raw = JSON.stringify([
      entry({
        snapshot: {
          ...snapshot(),
          bins: [
            { id: "good", x: 0, y: 0, width: 2, depth: 1, height: 3, label: "Good" },
            { id: "bad", x: -1, y: 0, width: 0, depth: 1, height: 3, label: "Bad" },
          ],
          estimateSettings: {
            material: "Unobtainium",
            priceUsdPerKg: -5,
            flowMm3PerS: 8,
          },
        } as unknown as SavedLayoutSnapshot,
      }),
    ]);
    const parsed = parseSavedLayouts(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].snapshot.bins.map((bin) => bin.label)).toEqual(["Good"]);
    expect(parsed[0].snapshot.estimateSettings.material).toBe("PLA");
    expect(parsed[0].snapshot.estimateSettings.priceUsdPerKg).toBeGreaterThan(0);
  });
});

describe("upsertSavedLayout", () => {
  it("appends a new name", () => {
    expect(upsertSavedLayout([], entry())).toHaveLength(1);
  });

  it("replaces the entry with the same name", () => {
    const first = entry();
    const second = entry({ id: "s2", snapshot: { ...snapshot(), numDrawers: 2 } });
    const result = upsertSavedLayout([first], second);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s2");
    expect(result[0].snapshot.numDrawers).toBe(2);
  });
});

describe("removeSavedLayout", () => {
  it("removes only the matching id", () => {
    const result = removeSavedLayout([entry(), entry({ id: "s2", name: "Other" })], "s1");
    expect(result.map((layout) => layout.id)).toEqual(["s2"]);
  });
});

describe("defaultSavedLayoutName", () => {
  it("names the layout after its drawer size", () => {
    expect(defaultSavedLayoutName(snapshot())).toBe("15 × 12 in layout");
  });
});

describe("createSavedLayoutId", () => {
  it("generates distinct ids", () => {
    expect(createSavedLayoutId()).not.toBe(createSavedLayoutId());
  });
});

describe("parseSavedLayouts divider-count migration", () => {
  it("maps a legacy boolean divider snapshot to a count", () => {
    const legacy = entry({
      snapshot: { ...snapshot(), dividerCount: undefined, dividers: true } as unknown as SavedLayoutSnapshot,
    });
    const parsed = parseSavedLayouts(JSON.stringify([legacy]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].snapshot.dividerCount).toBe(1);
  });

  it("clamps a legacy numeric divider snapshot to the supported range", () => {
    const legacy = entry({
      snapshot: { ...snapshot(), dividerCount: undefined, dividers: 9 } as unknown as SavedLayoutSnapshot,
    });
    const parsed = parseSavedLayouts(JSON.stringify([legacy]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].snapshot.dividerCount).toBe(3);
  });
});
