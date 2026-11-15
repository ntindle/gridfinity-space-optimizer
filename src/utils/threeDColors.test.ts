/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DEFAULT_PREVIEW_COLORS,
  isParsableColor,
  liftLightness,
  oklchToRgb,
  prefersDarkColorScheme,
  readPreviewColors,
  rgbToOklab,
  sceneColorsForTheme,
} from "./threeDColors";

describe("isParsableColor", () => {
  it("accepts hex and rgb forms", () => {
    expect(isParsableColor("#fff")).toBe(true);
    expect(isParsableColor("#ea580c")).toBe(true);
    expect(isParsableColor("rgb(234, 88, 12)")).toBe(true);
    expect(isParsableColor("rgba(0, 0, 0, 0.5)")).toBe(true);
  });

  it("rejects unresolved tokens and raw oklch", () => {
    expect(isParsableColor("")).toBe(false);
    expect(isParsableColor("var(--brand)")).toBe(false);
    expect(isParsableColor("oklch(25.5% 0.006 52)")).toBe(false);
    expect(isParsableColor("transparent")).toBe(false);
  });
});

describe("oklchToRgb", () => {
  it("converts the brand token to its rgb form", () => {
    expect(oklchToRgb("oklch(0.646 0.222 41.116)")).toBe("rgb(245, 73, 0)");
  });

  it("accepts lightness as a percentage", () => {
    expect(oklchToRgb("oklch(64.6% 0.222 41.116)")).toBe("rgb(245, 73, 0)");
  });

  it("converts achromatic endpoints exactly", () => {
    expect(oklchToRgb("oklch(1 0 0)")).toBe("rgb(255, 255, 255)");
    expect(oklchToRgb("oklch(0 0 0)")).toBe("rgb(0, 0, 0)");
  });

  it("converts the dark-mode tokens to dark rgb", () => {
    expect(oklchToRgb("oklch(0.255 0.006 52)")).toBe("rgb(37, 34, 32)");
    expect(oklchToRgb("oklch(0.38 0.012 60)")).toBe("rgb(71, 65, 60)");
    expect(oklchToRgb("oklch(0.155 0.004 50)")).toBe("rgb(14, 12, 11)");
  });

  it("returns null for values it cannot convert", () => {
    expect(oklchToRgb("not-a-color")).toBeNull();
    expect(oklchToRgb("oklch(0.5 0.1)")).toBeNull();
    expect(oklchToRgb("oklch(0.5 0.1 100 / 0.5)")).toBeNull();
    expect(oklchToRgb("")).toBeNull();
  });
});

describe("rgbToOklab", () => {
  it("converts achromatic endpoints", () => {
    const white = rgbToOklab("#ffffff");
    expect(white?.l).toBeCloseTo(1, 4);
    expect(white?.a).toBeCloseTo(0, 4);
    expect(white?.b).toBeCloseTo(0, 4);
    expect(rgbToOklab("#000000")).toEqual({ l: 0, a: 0, b: 0 });
  });

  it("accepts hex, rgb, and percent forms of the same color", () => {
    const hex = rgbToOklab("#472f1d");
    expect(rgbToOklab("rgb(71, 47, 29)")).toEqual(hex);
    expect(rgbToOklab("rgb(27.8%, 18.4%, 11.4%)")?.l).toBeCloseTo(hex?.l ?? 0, 2);
  });

  it("round-trips the oklch conversions", () => {
    const bin = rgbToOklab(oklchToRgb("oklch(0.38 0.012 60)") ?? "");
    expect(bin?.l).toBeCloseTo(0.38, 2);
    const plate = rgbToOklab(oklchToRgb("oklch(0.255 0.006 52)") ?? "");
    expect(plate?.l).toBeCloseTo(0.255, 2);
  });

  it("returns null for values it cannot convert", () => {
    expect(rgbToOklab("not-a-color")).toBeNull();
    expect(rgbToOklab("oklch(0.5 0.1 100)")).toBeNull();
    expect(rgbToOklab("rgba(0, 0, 0, 0)")).toBeNull();
    expect(rgbToOklab("")).toBeNull();
  });
});

describe("liftLightness", () => {
  it("lifts a dark plate color to the floor while keeping its hue", () => {
    const original = rgbToOklab("rgb(37, 34, 32)");
    const lifted = rgbToOklab(liftLightness("rgb(37, 34, 32)", 0.62));
    expect(lifted?.l).toBeCloseTo(0.62, 2);
    expect(lifted?.a).toBeCloseTo(original?.a ?? 0, 2);
    expect(lifted?.b).toBeCloseTo(original?.b ?? 0, 2);
  });

  it("leaves colors at or above the floor untouched", () => {
    expect(liftLightness("#ffffff", 0.62)).toBe("#ffffff");
    expect(liftLightness("rgb(245, 73, 0)", 0.62)).toBe("rgb(245, 73, 0)");
  });

  it("returns unparsable values unchanged", () => {
    expect(liftLightness("not-a-color", 0.62)).toBe("not-a-color");
  });
});

describe("sceneColorsForTheme", () => {
  it("returns the palette unchanged in light mode", () => {
    expect(sceneColorsForTheme(DEFAULT_PREVIEW_COLORS, false)).toBe(
      DEFAULT_PREVIEW_COLORS
    );
  });

  it("lifts dark-mode surfaces and keeps the selection color", () => {
    const dark = {
      baseplate: "rgb(37, 34, 32)",
      halfSize: "rgb(43, 40, 38)",
      spacer: "rgb(66, 61, 57)",
      bin: "rgb(71, 65, 60)",
      floor: "rgb(14, 12, 11)",
      selected: "rgb(249, 115, 22)",
    };
    const scene = sceneColorsForTheme(dark, true);
    expect(scene.selected).toBe(dark.selected);
    expect(scene.baseplate).not.toBe(dark.baseplate);
    expect(rgbToOklab(scene.baseplate)?.l).toBeCloseTo(0.62, 2);
    expect(rgbToOklab(scene.halfSize)?.l).toBeCloseTo(0.62, 2);
    expect(rgbToOklab(scene.spacer)?.l).toBeCloseTo(0.62, 2);
    expect(rgbToOklab(scene.bin)?.l).toBeCloseTo(0.62, 2);
    expect(rgbToOklab(scene.floor)?.l).toBeCloseTo(0.3, 2);
  });
});

describe("prefersDarkColorScheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is false when matchMedia is unavailable", () => {
    expect(prefersDarkColorScheme()).toBe(false);
  });

  it("follows the media query", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true }))
    );
    expect(prefersDarkColorScheme()).toBe(true);
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false }))
    );
    expect(prefersDarkColorScheme()).toBe(false);
  });
});

describe("readPreviewColors", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to the default palette when the browser cannot resolve tokens", () => {
    expect(readPreviewColors()).toEqual(DEFAULT_PREVIEW_COLORS);
  });

  it("resolves oklch tokens to rgb", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      backgroundColor: "oklch(0.646 0.222 41.116)",
    } as CSSStyleDeclaration);
    expect(readPreviewColors()).toEqual({
      baseplate: "rgb(245, 73, 0)",
      halfSize: "rgb(245, 73, 0)",
      spacer: "rgb(245, 73, 0)",
      bin: "rgb(245, 73, 0)",
      floor: "rgb(245, 73, 0)",
      selected: "rgb(245, 73, 0)",
    });
  });

  it("falls back for a transparent token", () => {
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      backgroundColor: "rgba(0, 0, 0, 0)",
    } as CSSStyleDeclaration);
    expect(readPreviewColors()).toEqual(DEFAULT_PREVIEW_COLORS);
  });
});
