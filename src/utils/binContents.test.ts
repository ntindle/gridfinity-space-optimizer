/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import {
  getBinContents,
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
