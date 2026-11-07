import { unitMath } from "@/services/unitMath";

export interface PreviewColors {
  baseplate: string;
  halfSize: string;
  spacer: string;
  bin: string;
  floor: string;
  selected: string;
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

export const oklchToRgb = (value: string): string | null => {
  const match = OKLCH_PATTERN.exec(value.trim());
  if (!match) return null;
  const lightness =
    match[2] === "%" ? unitMath.divide(Number(match[1]), 100) : Number(match[1]);
  const chroma = Number(match[3]);
  const hue = unitMath.toRadians(Number(match[4]));
  const a = unitMath.multiply(chroma, unitMath.cos(hue));
  const b = unitMath.multiply(chroma, unitMath.sin(hue));
  const lPrime = unitMath.add(
    lightness,
    unitMath.add(unitMath.multiply(0.3963377774, a), unitMath.multiply(0.2158037573, b))
  );
  const mPrime = unitMath.subtract(
    lightness,
    unitMath.add(unitMath.multiply(0.1055613458, a), unitMath.multiply(0.0638541728, b))
  );
  const sPrime = unitMath.subtract(
    lightness,
    unitMath.add(unitMath.multiply(0.0894841775, a), unitMath.multiply(1.2914855480, b))
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
