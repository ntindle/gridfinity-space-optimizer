import { unitMath } from "@/services/unitMath";
import type { Bin, LayoutItem } from "@/types";
import { binSizeLabel } from "@/utils/bins";
import { HALF_GRID_SIZE } from "@/utils/gridfinityUtils";

export interface LayoutSvgInput {
  drawerWidth: number;
  drawerHeight: number;
  layout: LayoutItem[];
  bins: Bin[];
}

const trim = (value: number): string => String(unitMath.round(value, 2));

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  dashed: boolean
): string =>
  `<rect x="${trim(x)}" y="${trim(y)}" width="${trim(width)}" height="${trim(height)}" fill="${fill}" stroke="#111827" stroke-width="1"${dashed ? ` stroke-dasharray="3 3"` : ""} />`;

const label = (x: number, y: number, width: number, height: number, text: string): string => {
  if (width < 24 || height < 14) return "";
  const fontSize = unitMath.min(6, unitMath.divide(width, 5));
  const centerX = unitMath.add(x, unitMath.divide(width, 2));
  const centerY = unitMath.add(y, unitMath.divide(height, 2));
  return `<text x="${trim(centerX)}" y="${trim(centerY)}" font-family="sans-serif" font-size="${trim(fontSize)}" fill="#111827" text-anchor="middle" dominant-baseline="central">${escapeXml(text)}</text>`;
};

export const layoutSvgPlan = ({ drawerWidth, drawerHeight, layout, bins }: LayoutSvgInput): string => {
  const pieces = layout.map((item) => {
    const fill = item.type === "spacer" ? "#ffffff" : item.type === "half-size" ? "#f3f4f6" : "#e5e7eb";
    const cells =
      item.type === "half-size"
        ? `${trim(unitMath.divide(item.pixelWidth, HALF_GRID_SIZE))} × ${trim(unitMath.divide(item.pixelHeight, HALF_GRID_SIZE))}`
        : `${trim(item.width)} × ${trim(item.height)}`;
    return (
      rect(item.pixelX, item.pixelY, item.pixelWidth, item.pixelHeight, fill, item.type === "spacer") +
      label(item.pixelX, item.pixelY, item.pixelWidth, item.pixelHeight, cells)
    );
  });
  const placed = bins.map((bin) => {
    const text = bin.label.trim().length > 0 ? bin.label : binSizeLabel(bin);
    return (
      rect(bin.x, bin.y, bin.width, bin.depth, "#dbeafe", false) +
      label(bin.x, bin.y, bin.width, bin.depth, text)
    );
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${trim(drawerWidth)} ${trim(drawerHeight)}" width="${trim(drawerWidth)}mm" height="${trim(drawerHeight)}mm" role="img">`,
    `<title>Gridfinity drawer plan</title>`,
    `<desc>Top view of a ${trim(drawerWidth)} by ${trim(drawerHeight)} mm drawer. All coordinates and sizes are in millimetres.</desc>`,
    rect(0, 0, drawerWidth, drawerHeight, "#ffffff", false),
    ...pieces,
    ...placed,
    `</svg>`,
  ].join("\n");
};
