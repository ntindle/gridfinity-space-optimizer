/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  DEFAULT_PREVIEW_COLORS,
  isParsableColor,
  oklchToRgb,
  readPreviewColors,
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
