import { unitMath } from "@/services/unitMath";
import { layoutPlanRects, type LayoutPlanInput, type PlanRect } from "./layoutPlan";

const trim = (value: number): string => String(unitMath.round(value, 2));

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const fillFor = (layer: PlanRect["layer"]): string =>
  layer === "spacer" || layer === "drawer"
    ? "#ffffff"
    : layer === "half"
      ? "#f3f4f6"
      : layer === "bin"
        ? "#dbeafe"
        : "#e5e7eb";

const rect = (item: PlanRect): string =>
  `<rect x="${trim(item.x)}" y="${trim(item.y)}" width="${trim(item.width)}" height="${trim(item.height)}" fill="${fillFor(item.layer)}" stroke="#111827" stroke-width="1"${item.layer === "spacer" ? ` stroke-dasharray="3 3"` : ""} />`;

const label = (item: PlanRect): string => {
  if (item.text === null || item.textHeight === null) return "";
  const centerX = unitMath.add(item.x, unitMath.divide(item.width, 2));
  const centerY = unitMath.add(item.y, unitMath.divide(item.height, 2));
  return `<text x="${trim(centerX)}" y="${trim(centerY)}" font-family="sans-serif" font-size="${trim(item.textHeight)}" fill="#111827" text-anchor="middle" dominant-baseline="central">${escapeXml(item.text)}</text>`;
};

export const layoutSvgPlan = ({ drawerWidth, drawerHeight, layout, bins }: LayoutPlanInput): string => {
  const items = layoutPlanRects({ drawerWidth, drawerHeight, layout, bins });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${trim(drawerWidth)} ${trim(drawerHeight)}" width="${trim(drawerWidth)}mm" height="${trim(drawerHeight)}mm" role="img">`,
    `<title>Gridfinity drawer plan</title>`,
    `<desc>Top view of a ${trim(drawerWidth)} by ${trim(drawerHeight)} mm drawer. All coordinates and sizes are in millimetres.</desc>`,
    ...items.map((item) => rect(item) + label(item)),
    `</svg>`,
  ].join("\n");
};
