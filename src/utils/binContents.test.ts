/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import {
  getBinContents,
  getBinContentsForBin,
  hasPerBinContents,
  perBinContentsKey,
  setBinContentsForBin,
  setBinContentsForItem,
  pruneBinContents,
} from "./binContents";
import type { LayoutItem } from "@/types";

const baseplate: LayoutItem = {
  x: 0,
  y: 0,
  width: 3,
  height: 2,
  type: "baseplate",
  pixelX: 0,
  pixelY: 0,
  pixelWidth: 126,
  pixelHeight: 84,
};

const spacer: LayoutItem = {
  x: 0,
  y: 2,
  width: 6,
  height: 0.5,
  type: "spacer",
  pixelX: 0,
  pixelY: 84,
  pixelWidth: 252,
  pixelHeight: 21,
};

describe("binContents", () => {
  it("reads contents by group key and returns empty string when unset", () => {
    expect(getBinContents({ "baseplate:3x2": "M3 screws" }, baseplate)).toBe(
      "M3 screws"
    );
    expect(getBinContents({}, baseplate)).toBe("");
    expect(
      getBinContents({ "baseplate:3x2": "M3 screws" }, spacer)
    ).toBe("");
  });

  it("sets a trimmed value without mutating the input", () => {
    const before = { "spacer:6x0.5": "shims" };
    const next = setBinContentsForItem(before, baseplate, "  M3 screws  ");
    expect(next).toEqual({
      "spacer:6x0.5": "shims",
      "baseplate:3x2": "M3 screws",
    });
    expect(before).toEqual({ "spacer:6x0.5": "shims" });
  });

  it("removes the key when the value is blank", () => {
    const before = {
      "baseplate:3x2": "M3 screws",
      "spacer:6x0.5": "shims",
    };
    expect(setBinContentsForItem(before, baseplate, "   ")).toEqual({
      "spacer:6x0.5": "shims",
    });
  });

  it("prunes keys whose groups are gone from the layout", () => {
    const contents = {
      "baseplate:3x2": "M3 screws",
      "half-size:2x2": "stale",
    };
    expect(pruneBinContents(contents, [baseplate, spacer])).toEqual({
      "baseplate:3x2": "M3 screws",
    });
    expect(pruneBinContents({}, [baseplate])).toEqual({});
  });
});

describe("binContents per-bin overrides", () => {
  it("builds a per-bin key from the group key and bin index", () => {
    expect(perBinContentsKey("baseplate:3x2", 0)).toBe("baseplate:3x2#0");
    expect(perBinContentsKey("baseplate:3x2", 7)).toBe("baseplate:3x2#7");
  });

  it("prefers the per-bin value and falls back to the group value", () => {
    const contents = {
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#1": "M4 screws",
    };
    expect(getBinContentsForBin(contents, "baseplate:3x2", 0)).toBe(
      "M3 screws"
    );
    expect(getBinContentsForBin(contents, "baseplate:3x2", 1)).toBe(
      "M4 screws"
    );
    expect(getBinContentsForBin(contents, "baseplate:3x2", 2)).toBe(
      "M3 screws"
    );
    expect(getBinContentsForBin({}, "baseplate:3x2", 0)).toBe("");
  });

  it("sets and clears per-bin values without touching the group value", () => {
    const before = { "baseplate:3x2": "M3 screws" };
    const next = setBinContentsForBin(before, "baseplate:3x2", 1, "M4 screws");
    expect(next).toEqual({
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#1": "M4 screws",
    });
    expect(before).toEqual({ "baseplate:3x2": "M3 screws" });
    expect(setBinContentsForBin(next, "baseplate:3x2", 1, "   ")).toEqual({
      "baseplate:3x2": "M3 screws",
    });
  });

  it("detects per-bin overrides for a group key", () => {
    expect(hasPerBinContents({ "baseplate:3x2#0": "M4 screws" }, "baseplate:3x2")).toBe(
      true
    );
    expect(hasPerBinContents({ "baseplate:3x2": "M3 screws" }, "baseplate:3x2")).toBe(
      false
    );
    expect(hasPerBinContents({}, "baseplate:3x2")).toBe(false);
  });

  it("prunes per-bin keys whose bin index is out of range or whose group is gone", () => {
    const contents = {
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#0": "M4 screws",
      "baseplate:3x2#1": "M5 screws",
      "baseplate:3x2#9": "stale",
      "half-size:2x2#0": "stale",
    };
    expect(pruneBinContents(contents, [baseplate, spacer])).toEqual({
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#0": "M4 screws",
    });
  });
});
