import { unitMath } from "@/services/unitMath";
import type { Bin, LayoutItem } from "@/types";
import { binSizeLabel } from "@/utils/bins";
import { HALF_GRID_SIZE } from "@/utils/gridfinityUtils";

export interface LayoutPlanInput {
  drawerWidth: number;
  drawerHeight: number;
  layout: LayoutItem[];
  bins: Bin[];
}

export type PlanLayer = "drawer" | "baseplate" | "spacer" | "half" | "bin";

export interface PlanRect {
  layer: PlanLayer;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string | null;
  textHeight: number | null;
}

const trim = (value: number): string => String(unitMath.round(value, 2));

const labelFor = (width: number, height: number, text: string): PlanRect["text"] =>
  width < 24 || height < 14 ? null : text;

const textHeightFor = (width: number): number => unitMath.min(6, unitMath.divide(width, 5));

export const layoutPlanRects = ({ drawerWidth, drawerHeight, layout, bins }: LayoutPlanInput): PlanRect[] => {
  const drawer: PlanRect = {
    layer: "drawer",
    x: 0,
    y: 0,
    width: drawerWidth,
    height: drawerHeight,
    text: null,
    textHeight: null,
  };
  const pieces = layout.map((item) => {
    const layer: PlanLayer = item.type === "spacer" ? "spacer" : item.type === "half-size" ? "half" : "baseplate";
    const cells =
      item.type === "half-size"
        ? `${trim(unitMath.divide(item.pixelWidth, HALF_GRID_SIZE))} × ${trim(unitMath.divide(item.pixelHeight, HALF_GRID_SIZE))}`
        : `${trim(item.width)} × ${trim(item.height)}`;
    const text = labelFor(item.pixelWidth, item.pixelHeight, cells);
    return {
      layer,
      x: item.pixelX,
      y: item.pixelY,
      width: item.pixelWidth,
      height: item.pixelHeight,
      text,
      textHeight: text === null ? null : textHeightFor(item.pixelWidth),
    };
  });
  const placed = bins.map((bin) => {
    const raw = bin.label.trim().length > 0 ? bin.label : binSizeLabel(bin);
    const text = labelFor(bin.width, bin.depth, raw);
    return {
      layer: "bin" as PlanLayer,
      x: bin.x,
      y: bin.y,
      width: bin.width,
      height: bin.depth,
      text,
      textHeight: text === null ? null : textHeightFor(bin.width),
    };
  });
  return [drawer, ...pieces, ...placed];
};
