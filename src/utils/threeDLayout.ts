import { unitMath } from "@/services/unitMath";
import { BIN_HEIGHT_UNIT_MM, STACKING_LIP_HEIGHT_MM } from "@/utils/bins";
import { previewPieceKey } from "@/utils/previewPieceDetails";
import { BASEPLATE_HEIGHT_MM } from "@/utils/printParts";
import type { Bin, DrawerSize, LayoutItem } from "@/types";

export type ThreeDBoxKind = "baseplate" | "half-size" | "spacer" | "bin";

export interface ThreeDBox {
  key: string;
  kind: ThreeDBoxKind;
  binId: string | null;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
  baseY: number;
  height: number;
}

export const boxForInstance = (
  boxes: ThreeDBox[],
  instanceId: number | undefined
): ThreeDBox | null => {
  if (instanceId === undefined) return null;
  return boxes[instanceId] ?? null;
};

export const CLICK_DRAG_LIMIT_PX = 5;

export const boxForPointerClick = (
  boxes: ThreeDBox[],
  instanceId: number | undefined,
  delta: number | undefined
): ThreeDBox | null => {
  if ((delta ?? 0) > CLICK_DRAG_LIMIT_PX) return null;
  return boxForInstance(boxes, instanceId);
};

export const buildThreeDBoxes = (
  layout: LayoutItem[],
  bins: Bin[],
  drawerMm: DrawerSize,
  binGroupKey: Map<string, string> = new Map()
): ThreeDBox[] => {
  const center = (position: number, size: number, drawer: number): number =>
    unitMath.subtract(
      unitMath.add(position, unitMath.divide(size, 2)),
      unitMath.divide(drawer, 2)
    );
  const boxes: ThreeDBox[] = layout.map((item) => ({
    key: previewPieceKey(item),
    kind: item.type,
    binId: null,
    centerX: center(item.pixelX, item.pixelWidth, drawerMm.width),
    centerZ: center(item.pixelY, item.pixelHeight, drawerMm.height),
    width: item.pixelWidth,
    depth: item.pixelHeight,
    baseY: 0,
    height: BASEPLATE_HEIGHT_MM,
  }));
  for (const bin of bins) {
    boxes.push({
      key: binGroupKey.get(bin.id) ?? `bin:${bin.id}`,
      kind: "bin",
      binId: bin.id,
      centerX: center(bin.x, bin.width, drawerMm.width),
      centerZ: center(bin.y, bin.depth, drawerMm.height),
      width: bin.width,
      depth: bin.depth,
      baseY: BASEPLATE_HEIGHT_MM,
      height: unitMath.add(
        unitMath.multiply(bin.height, BIN_HEIGHT_UNIT_MM),
        STACKING_LIP_HEIGHT_MM
      ),
    });
  }
  return boxes;
};
