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

  it("only counts per-bin names for bins the group has right now", () => {
    const contents = {
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#9": "kept for later",
    };
    expect(hasPerBinContents(contents, "baseplate:3x2", 2)).toBe(false);
    expect(hasPerBinContents(contents, "baseplate:3x2", 10)).toBe(true);
    expect(hasPerBinContents(contents, "baseplate:3x2")).toBe(true);
    expect(hasPerBinContents({ "baseplate:3x20#0": "other group" }, "baseplate:3x2")).toBe(false);
  });
});
