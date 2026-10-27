import { BIN_HEIGHT_UNIT_MM, STACKING_LIP_FILLET_RADIUS } from "@/utils/bins";
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

export const BIN_BASE_HEIGHT = 7;
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
    { inset: 1.9, z: top + 2.5 },
    { inset: 1.9, z: top + 0.7 },
    { inset: 2.6, z: top },
    { inset: 2.6, z: top - 1.2 },
    { inset: BIN_WALL, z: top - 1.2 - (2.6 - BIN_WALL) },
    { inset: BIN_WALL, z: BIN_BASE_HEIGHT },
  ];
};
