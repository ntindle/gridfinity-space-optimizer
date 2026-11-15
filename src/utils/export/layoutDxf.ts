import { unitMath } from "@/services/unitMath";
import { layoutPlanRects, type LayoutPlanInput, type PlanRect } from "./layoutPlan";

const trim = (value: number): string => String(unitMath.round(value, 2));

const group = (code: number, value: string): string => `${String(code).padStart(3, " ")}\n${value}`;

const escapeDxfText = (value: string): string =>
  value.replace(/%/g, "%%").replace(/[\r\n]+/g, " ").replace(/×/g, "x");

const layerName = (layer: PlanRect["layer"]): string =>
  layer === "drawer"
    ? "DRAWER"
    : layer === "baseplate"
      ? "BASEPLATE"
      : layer === "spacer"
        ? "SPACER"
        : layer === "half"
          ? "HALF"
          : "BIN";

const polyline = (item: PlanRect, drawerHeight: number): string => {
  const yLow = unitMath.subtract(unitMath.subtract(drawerHeight, item.y), item.height);
  const yHigh = unitMath.subtract(drawerHeight, item.y);
  const xLow = item.x;
  const xHigh = unitMath.add(item.x, item.width);
  const vertex = (vx: number, vy: number): string =>
    [group(10, trim(vx)), group(20, trim(vy))].join("\n");
  return [
    group(0, "LWPOLYLINE"),
    group(8, layerName(item.layer)),
    group(90, "4"),
    group(70, "1"),
    vertex(xLow, yLow),
    vertex(xHigh, yLow),
    vertex(xHigh, yHigh),
    vertex(xLow, yHigh),
  ].join("\n");
};

const text = (item: PlanRect, drawerHeight: number): string => {
  if (item.text === null || item.textHeight === null) return "";
  const centerX = unitMath.add(item.x, unitMath.divide(item.width, 2));
  const centerY = unitMath.subtract(
    drawerHeight,
    unitMath.add(item.y, unitMath.divide(item.height, 2))
  );
  return [
    group(0, "TEXT"),
    group(8, layerName(item.layer)),
    group(10, trim(centerX)),
    group(20, trim(centerY)),
    group(40, trim(item.textHeight)),
    group(1, escapeDxfText(item.text)),
    group(72, "1"),
    group(73, "2"),
    group(11, trim(centerX)),
    group(21, trim(centerY)),
  ].join("\n");
};

const layerEntry = (name: string): string =>
  [
    group(0, "LAYER"),
    group(2, name),
    group(70, "0"),
    group(62, "7"),
    group(6, "Continuous"),
  ].join("\n");

export const layoutDxfPlan = ({ drawerWidth, drawerHeight, layout, bins }: LayoutPlanInput): string => {
  const items = layoutPlanRects({ drawerWidth, drawerHeight, layout, bins });
  const entities = items
    .flatMap((item) => [polyline(item, drawerHeight), text(item, drawerHeight)])
    .filter((entry) => entry.length > 0);
  return [
    group(0, "SECTION"),
    group(2, "HEADER"),
    group(9, "$ACADVER"),
    group(1, "AC1014"),
    group(9, "$MEASUREMENT"),
    group(70, "1"),
    group(9, "$INSUNITS"),
    group(70, "4"),
    group(999, "Gridfinity drawer plan: all coordinates and sizes are in millimetres, CAD Y-up"),
    group(0, "ENDSEC"),
    group(0, "SECTION"),
    group(2, "TABLES"),
    group(0, "TABLE"),
    group(2, "LAYER"),
    group(70, "5"),
    layerEntry("DRAWER"),
    layerEntry("BASEPLATE"),
    layerEntry("SPACER"),
    layerEntry("HALF"),
    layerEntry("BIN"),
    group(0, "ENDTAB"),
    group(0, "ENDSEC"),
    group(0, "SECTION"),
    group(2, "ENTITIES"),
    ...entities,
    group(0, "ENDSEC"),
    group(0, "EOF"),
  ].join("\n") + "\n";
};
