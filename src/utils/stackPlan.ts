import { unitMath } from "@/services/unitMath";
import type { PrintPartSummary } from "@/utils/printParts";
import type { Plate } from "@/utils/printPlan";

export const STACK_GAP_MM = 0.2;
export const STACK_Z_MARGIN_MM = 5;
export const MAX_STACK_LAYERS = 10;

const STACKABLE_KINDS = new Set<PrintPartSummary["kind"]>(["baseplate", "spacer", "lid"]);

export interface PlateStack {
  layers: number;
  jobs: number;
}

export const plateHeight = (
  plate: Plate,
  byKey: Map<string, PrintPartSummary>
): number =>
  plate.parts.reduce(
    (max, { key }) => unitMath.max(max, byKey.get(key)?.height ?? 0),
    0
  );

export const maxStackLayers = (partHeight: number, printerZ: number): number => {
  if (partHeight <= 0) return 1;
  const room = unitMath.subtract(printerZ, STACK_Z_MARGIN_MM);
  const layers = unitMath.floor(
    unitMath.divide(unitMath.add(room, STACK_GAP_MM), unitMath.add(partHeight, STACK_GAP_MM))
  );
  return unitMath.max(1, unitMath.min(MAX_STACK_LAYERS, layers));
};

export const planPlateStack = (
  plate: Plate,
  byKey: Map<string, PrintPartSummary>,
  printerZ: number
): PlateStack | null => {
  if (plate.copies < 2) return null;
  const flat = plate.parts.every(({ key }) => {
    const part = byKey.get(key);
    return part !== undefined && STACKABLE_KINDS.has(part.kind);
  });
  if (!flat) return null;
  const limit = maxStackLayers(plateHeight(plate, byKey), printerZ);
  if (limit < 2) return null;
  const jobs = unitMath.ceil(unitMath.divide(plate.copies, limit));
  const layers = unitMath.ceil(unitMath.divide(plate.copies, jobs));
  return { layers, jobs };
};

export const countPrintJobs = (
  plates: Plate[],
  byKey: Map<string, PrintPartSummary>,
  printerZ: number,
  stacked: boolean
): number =>
  plates.reduce((sum, plate) => {
    const stack = stacked ? planPlateStack(plate, byKey, printerZ) : null;
    return unitMath.add(sum, stack ? stack.jobs : plate.copies);
  }, 0);
