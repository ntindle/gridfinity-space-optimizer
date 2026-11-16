import { describe, expect, it } from "vitest";
import {
  DRAWER_PRESETS,
  drawerPresetById,
  findDrawerPreset,
} from "./drawerPresets";

describe("drawerPresets", () => {
  it("ships named presets with sourced drawer sizes", () => {
    expect(DRAWER_PRESETS.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(DRAWER_PRESETS.map((preset) => preset.id));
    expect(ids.size).toBe(DRAWER_PRESETS.length);
    for (const preset of DRAWER_PRESETS) {
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.source.length).toBeGreaterThan(0);
      expect(preset.sourceUrl).toMatch(/^https:\/\//);
      expect(preset.size.width).toBeGreaterThan(0);
      expect(preset.size.height).toBeGreaterThan(0);
    }
  });

  it("finds the preset whose size matches exactly", () => {
    expect(findDrawerPreset({ width: 11.5, height: 20.6 })?.id).toBe("ikea-alex");
    expect(findDrawerPreset({ width: 47.6, height: 15.8 })?.id).toBe(
      "husky-52-full-length"
    );
  });

  it("finds the preset for mm-mode dims converted back to inches", () => {
    expect(findDrawerPreset({ width: 292.1 / 25.4, height: 523.24 / 25.4 })?.id).toBe(
      "ikea-alex"
    );
  });

  it("finds no preset for custom dims", () => {
    expect(findDrawerPreset({ width: 22.5, height: 16.5 })).toBeUndefined();
    expect(findDrawerPreset({ width: 11.5, height: 20.5 })).toBeUndefined();
  });

  it("looks presets up by id and rejects unknown ids", () => {
    expect(drawerPresetById("husky-52-left-large").size).toEqual({
      width: 31.6,
      height: 15.8,
    });
    expect(() => drawerPresetById("no-such-drawer")).toThrow(/Unknown drawer preset/);
  });
});
