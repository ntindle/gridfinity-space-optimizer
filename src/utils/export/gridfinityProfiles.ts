import { unitMath } from "@/services/unitMath";
import {
  BIN_HEIGHT_UNIT_MM,
  STACKING_LIP_FILLET_RADIUS,
  VASE_MODE_WALL_MM,
} from "@/utils/bins";
import { BASEPLATE_HEIGHT_MM } from "@/utils/printParts";

export interface ProfilePoint {
  inset: number;
  z: number;
}

export const ARC_SEGMENTS = 8;

export const BASEPLATE_CORNER_RADIUS = 4;

export const POCKET_PROFILE = [
  { z: 0, inset: 2.85 },
  { z: 0.35, inset: 2.85 },
  { z: 1.05, inset: 2.15 },
  { z: 2.85, inset: 2.15 },
  { z: BASEPLATE_HEIGHT_MM, inset: 0 },
] as const;

export const CONNECTOR_BAND_HEIGHT_MM = 2.5;
export const CONNECTOR_PROTRUSION_MM = 2;
export const CONNECTOR_DEPTH_MM = 2;
export const CONNECTOR_CLEARANCE_MM = 0.4;

export type BaseplateConnectorKind = "tab" | "recess";

export interface BaseplateConnectors {
  left?: BaseplateConnectorKind;
  right?: BaseplateConnectorKind;
  top?: BaseplateConnectorKind;
  bottom?: BaseplateConnectorKind;
}

export const connectorProtrusion = (
  connectors?: BaseplateConnectors
): { left: number; right: number; top: number; bottom: number } => ({
  left: connectors?.left === "tab" ? CONNECTOR_PROTRUSION_MM : 0,
  right: connectors?.right === "tab" ? CONNECTOR_PROTRUSION_MM : 0,
  top: connectors?.top === "tab" ? CONNECTOR_PROTRUSION_MM : 0,
  bottom: connectors?.bottom === "tab" ? CONNECTOR_PROTRUSION_MM : 0,
});

export const connectorWidthsMm = (
  cellSize: number,
  kind: BaseplateConnectorKind
): { neck: number; head: number } => {
  const neck = unitMath.multiply(cellSize, unitMath.divide(10, 42));
  const head = unitMath.multiply(cellSize, unitMath.divide(16, 42));
  if (kind === "recess") {
    return {
      neck: unitMath.add(neck, CONNECTOR_CLEARANCE_MM),
      head: unitMath.add(head, CONNECTOR_CLEARANCE_MM),
    };
  }
  return { neck, head };
};

export const connectorTrapezoidAreaMm2 = (
  cellSize: number,
  kind: BaseplateConnectorKind
): number => {
  const { neck, head } = connectorWidthsMm(cellSize, kind);
  const depth = kind === "tab" ? CONNECTOR_PROTRUSION_MM : CONNECTOR_DEPTH_MM;
  return unitMath.multiply(unitMath.divide(unitMath.add(neck, head), 2), depth);
};

export const BIN_BASE_HEIGHT = 7;
export const STACKING_LIP_INNER_INSET_MM = 1.9;
export const FOOT_PROFILE: readonly ProfilePoint[] = [
  { inset: 2.95, z: 0 },
  { inset: 2.15, z: 0.8 },
  { inset: 2.15, z: 2.6 },
  { inset: 0, z: 4.75 },
];
export const BIN_GAP = 0.25;
export const BIN_TOP_RADIUS = 3.75;
export const BIN_WALL = 0.95;

const FOOT_TOP = FOOT_PROFILE[FOOT_PROFILE.length - 1].z;
const FILLET_STEPS = 6;
const FILLET_SWEEP_DEGREES = 135;

export const binWallProfile = (height: number): ProfilePoint[] => {
  const top = height * BIN_HEIGHT_UNIT_MM;
  const radius = STACKING_LIP_FILLET_RADIUS;
  const filletCenter = top + 4.4 - radius * (1 + Math.SQRT2);
  const fillet = Array.from({ length: FILLET_STEPS + 1 }, (_, step) => {
    const angle = (((FILLET_SWEEP_DEGREES * step) / FILLET_STEPS) * Math.PI) / 180;
    return { inset: radius - radius * Math.cos(angle), z: filletCenter + radius * Math.sin(angle) };
  });
  return [
    { inset: 0, z: FOOT_TOP },
    ...fillet,
    { inset: STACKING_LIP_INNER_INSET_MM, z: top + 2.5 },
    { inset: STACKING_LIP_INNER_INSET_MM, z: top + 0.7 },
    { inset: 2.6, z: top },
    { inset: 2.6, z: top - 1.2 },
    { inset: BIN_WALL, z: top - 1.2 - (2.6 - BIN_WALL) },
    { inset: BIN_WALL, z: BIN_BASE_HEIGHT },
  ];
};

export const scoopTopZMm = (height: number): number =>
  unitMath.add(
    BIN_BASE_HEIGHT,
    unitMath.divide(
      unitMath.subtract(
        unitMath.multiply(height, BIN_HEIGHT_UNIT_MM),
        BIN_BASE_HEIGHT
      ),
      2
    )
  );

export const vaseWallProfile = (height: number): ProfilePoint[] => {
  const profile = binWallProfile(height);
  const lipTopIndex = profile.findIndex(
    (point) => point.inset === STACKING_LIP_INNER_INSET_MM
  );
  const outer = profile.slice(0, lipTopIndex + 1);
  const inner = outer
    .slice(1)
    .map((point) => ({
      inset: unitMath.add(point.inset, VASE_MODE_WALL_MM),
      z: point.z,
    }))
    .reverse();
  return [
    ...outer,
    ...inner,
    { inset: VASE_MODE_WALL_MM, z: BIN_BASE_HEIGHT },
  ];
};
