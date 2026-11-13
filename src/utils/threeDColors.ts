import { unitMath } from "@/services/unitMath";

export interface PreviewColors {
  baseplate: string;
  halfSize: string;
  spacer: string;
  bin: string;
  floor: string;
  selected: string;
}

export interface OklabColor {
  l: number;
  a: number;
  b: number;
}

export const DEFAULT_PREVIEW_COLORS: PreviewColors = {
  baseplate: "#ffffff",
  halfSize: "#e8f2f5",
  spacer: "#d6d3d1",
  bin: "#f3ead9",
  floor: "#f5f5f4",
  selected: "#ea580c",
};

const COLOR_TOKENS: Record<keyof PreviewColors, string> = {
  baseplate: "--plate",
  halfSize: "--half",
  spacer: "--spacer-hatch",
  bin: "--bin",
  floor: "--drawer-floor",
  selected: "--brand",
};

export const isParsableColor = (value: string): boolean =>
  /^(#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})|rgba?\([\d\s.,%/-]+\))$/i.test(value.trim());

const OKLCH_PATTERN =
  /^oklch\(\s*(\d+(?:\.\d+)?)(%)?\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*\)$/i;

const linearToSrgb = (value: number): number => {
  if (value <= 0.0031308) return unitMath.multiply(12.92, value);
  return unitMath.subtract(
    unitMath.multiply(1.055, unitMath.pow(value, unitMath.divide(1, 2.4))),
    0.055
  );
};

const toChannel = (linear: number): number => {
  const clamped = unitMath.max(0, unitMath.min(1, linearToSrgb(linear)));
  return unitMath.round(unitMath.multiply(clamped, 255), 0);
};

const oklabToRgb = (color: OklabColor): string | null => {
  const lPrime = unitMath.add(
    color.l,
    unitMath.add(unitMath.multiply(0.3963377774, color.a), unitMath.multiply(0.2158037573, color.b))
  );
  const mPrime = unitMath.subtract(
    color.l,
    unitMath.add(unitMath.multiply(0.1055613458, color.a), unitMath.multiply(0.0638541728, color.b))
  );
  const sPrime = unitMath.subtract(
    color.l,
    unitMath.add(unitMath.multiply(0.0894841775, color.a), unitMath.multiply(1.2914855480, color.b))
  );
  const l = unitMath.pow(lPrime, 3);
  const m = unitMath.pow(mPrime, 3);
  const s = unitMath.pow(sPrime, 3);
  const red = unitMath.add(
    unitMath.subtract(unitMath.multiply(4.0767416621, l), unitMath.multiply(3.3077115913, m)),
    unitMath.multiply(0.2309699292, s)
  );
  const green = unitMath.subtract(
    unitMath.add(unitMath.multiply(-1.2684380046, l), unitMath.multiply(2.6097574011, m)),
    unitMath.multiply(0.3413193965, s)
  );
  const blue = unitMath.add(
    unitMath.subtract(unitMath.multiply(-0.0041960863, l), unitMath.multiply(0.7034186147, m)),
    unitMath.multiply(1.7076147010, s)
  );
  const rgb = `rgb(${toChannel(red)}, ${toChannel(green)}, ${toChannel(blue)})`;
  return isParsableColor(rgb) ? rgb : null;
};

export const oklchToRgb = (value: string): string | null => {
  const match = OKLCH_PATTERN.exec(value.trim());
  if (!match) return null;
  const lightness =
    match[2] === "%" ? unitMath.divide(Number(match[1]), 100) : Number(match[1]);
  const chroma = Number(match[3]);
  const hue = unitMath.toRadians(Number(match[4]));
  return oklabToRgb({
    l: lightness,
    a: unitMath.multiply(chroma, unitMath.cos(hue)),
    b: unitMath.multiply(chroma, unitMath.sin(hue)),
  });
};

const srgbToLinear = (channel: number): number => {
  const normalized = unitMath.divide(channel, 255);
  if (normalized <= 0.04045) return unitMath.divide(normalized, 12.92);
  return unitMath.pow(unitMath.divide(unitMath.add(normalized, 0.055), 1.055), 2.4);
};

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_PATTERN = /^rgba?\(([^)]+)\)$/i;

const parseChannels = (value: string): [number, number, number] | null => {
  const trimmed = value.trim();
  const hex = HEX_PATTERN.exec(trimmed);
  if (hex) {
    const digits = hex[1];
    const expanded =
      digits.length === 3
        ? digits
            .split("")
            .map((digit) => digit + digit)
            .join("")
        : digits;
    return [
      parseInt(expanded.slice(0, 2), 16),
      parseInt(expanded.slice(2, 4), 16),
      parseInt(expanded.slice(4, 6), 16),
    ];
  }
  const rgb = RGB_PATTERN.exec(trimmed);
  if (!rgb) return null;
  const [colorPart, alphaPart] = rgb[1].split("/");
  if (alphaPart !== undefined && Number(alphaPart.trim()) === 0) return null;
  const parts = colorPart.split(/[,\s]+/).filter((part) => part.length > 0);
  if (parts.length < 3) return null;
  if (parts.length > 3 && Number(parts[3]) === 0) return null;
  const channels = parts.slice(0, 3).map((part) =>
    part.endsWith("%")
      ? unitMath.multiply(Number(part.slice(0, -1)), 2.55)
      : Number(part)
  );
  if (channels.some((channel) => Number.isNaN(channel))) return null;
  return [channels[0], channels[1], channels[2]];
};

export const rgbToOklab = (value: string): OklabColor | null => {
  const channels = parseChannels(value);
  if (!channels) return null;
  const [red, green, blue] = channels.map(srgbToLinear);
  const l = unitMath.add(
    unitMath.add(
      unitMath.multiply(0.4122214708, red),
      unitMath.multiply(0.5363325363, green)
    ),
    unitMath.multiply(0.0514459929, blue)
  );
  const m = unitMath.add(
    unitMath.add(
      unitMath.multiply(0.2119034982, red),
      unitMath.multiply(0.6806995451, green)
    ),
    unitMath.multiply(0.1073969566, blue)
  );
  const s = unitMath.add(
    unitMath.add(
      unitMath.multiply(0.0883024619, red),
      unitMath.multiply(0.2817188376, green)
    ),
    unitMath.multiply(0.6299787005, blue)
  );
  const lRoot = unitMath.pow(unitMath.max(0, l), unitMath.divide(1, 3));
  const mRoot = unitMath.pow(unitMath.max(0, m), unitMath.divide(1, 3));
  const sRoot = unitMath.pow(unitMath.max(0, s), unitMath.divide(1, 3));
  return {
    l: unitMath.subtract(
      unitMath.add(
        unitMath.multiply(0.2104542553, lRoot),
        unitMath.multiply(0.7936177850, mRoot)
      ),
      unitMath.multiply(0.0040720468, sRoot)
    ),
    a: unitMath.add(
      unitMath.subtract(
        unitMath.multiply(1.9779984951, lRoot),
        unitMath.multiply(2.4285922050, mRoot)
      ),
      unitMath.multiply(0.4505937099, sRoot)
    ),
    b: unitMath.subtract(
      unitMath.add(
        unitMath.multiply(0.0259040371, lRoot),
        unitMath.multiply(0.7827717662, mRoot)
      ),
      unitMath.multiply(0.8086757660, sRoot)
    ),
  };
};

export const liftLightness = (value: string, floor: number): string => {
  const oklab = rgbToOklab(value);
  if (!oklab || oklab.l >= floor) return value;
  return oklabToRgb({ ...oklab, l: floor }) ?? value;
};

export const DARK_SCENE_BOX_LIGHTNESS = 0.62;
export const DARK_SCENE_FLOOR_LIGHTNESS = 0.3;

export const sceneColorsForTheme = (
  colors: PreviewColors,
  isDark: boolean
): PreviewColors => {
  if (!isDark) return colors;
  return {
    baseplate: liftLightness(colors.baseplate, DARK_SCENE_BOX_LIGHTNESS),
    halfSize: liftLightness(colors.halfSize, DARK_SCENE_BOX_LIGHTNESS),
    spacer: liftLightness(colors.spacer, DARK_SCENE_BOX_LIGHTNESS),
    bin: liftLightness(colors.bin, DARK_SCENE_BOX_LIGHTNESS),
    floor: liftLightness(colors.floor, DARK_SCENE_FLOOR_LIGHTNESS),
    selected: colors.selected,
  };
};

export const darkColorSchemeQuery = (): MediaQueryList | null => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }
  return window.matchMedia("(prefers-color-scheme: dark)");
};

export const prefersDarkColorScheme = (): boolean =>
  darkColorSchemeQuery()?.matches ?? false;

const readToken = (token: string): string | null => {
  const probe = document.createElement("div");
  probe.style.backgroundColor = `var(${token})`;
  probe.style.position = "fixed";
  probe.style.visibility = "hidden";
  document.body.appendChild(probe);
  const value = window.getComputedStyle(probe).backgroundColor;
  probe.remove();
  if (value === "rgba(0, 0, 0, 0)") return null;
  if (isParsableColor(value)) return value;
  return oklchToRgb(value);
};

export const readPreviewColors = (): PreviewColors => {
  const colors = { ...DEFAULT_PREVIEW_COLORS };
  (Object.keys(COLOR_TOKENS) as (keyof PreviewColors)[]).forEach((key) => {
    colors[key] = readToken(COLOR_TOKENS[key]) ?? DEFAULT_PREVIEW_COLORS[key];
  });
  return colors;
};
