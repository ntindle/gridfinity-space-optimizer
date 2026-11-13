import { unitMath } from "@/services/unitMath";
import {
  BIN_HEIGHT_UNIT_MM,
  DIVIDER_THICKNESS_MM,
  LABEL_TAB_ABOVE_LIP_MM,
  LABEL_TAB_FUSE_MM,
  LABEL_TAB_MAX_WIDTH_MM,
  LABEL_TAB_SIDE_MARGIN_MM,
  LABEL_TAB_THICKNESS_MM,
  LID_LIP_CLEARANCE_MM,
  LID_LIP_DEPTH_MM,
  LID_LIP_THICKNESS_MM,
  LID_THICKNESS_MM,
  MAGNET_HOLE_DEPTH_MM,
  SCOOP_SPAN_END_FRACTION,
  SCOOP_SPAN_START_FRACTION,
  magnetHoleCount,
  screwHoleCount,
} from "@/utils/bins";
import {
  ARC_SEGMENTS,
  BASEPLATE_CORNER_RADIUS,
  BIN_BASE_HEIGHT,
  BIN_GAP,
  BIN_TOP_RADIUS,
  FOOT_PROFILE,
  POCKET_PROFILE,
  STACKING_LIP_INNER_INSET_MM,
  binWallProfile,
  scoopTopZMm,
  type ProfilePoint,
} from "@/utils/export/gridfinityProfiles";
import { magnetHoleRing, screwHoleRing, type Point } from "@/utils/export/shapes";
import { BASEPLATE_HEIGHT_MM } from "@/utils/printParts";
import type { PrintPartSummary } from "@/utils/printParts";

export const PLA_DENSITY_G_PER_CM3 = 1.24;
export const PETG_DENSITY_G_PER_CM3 = 1.27;
export const ABS_DENSITY_G_PER_CM3 = 1.04;
export const FILAMENT_PRICE_USD_PER_KG = 20;
export const EFFECTIVE_FLOW_MM3_PER_S = 8;
export const MIN_FILAMENT_PRICE_USD_PER_KG = 1;
export const MAX_FILAMENT_PRICE_USD_PER_KG = 200;
export const MIN_EFFECTIVE_FLOW_MM3_PER_S = 1;
export const MAX_EFFECTIVE_FLOW_MM3_PER_S = 50;
export const MM3_PER_CM3 = 1000;
export const GRAMS_PER_KG = 1000;

export type EstimateMaterial = "PLA" | "PETG" | "ABS";

export const ESTIMATE_MATERIALS: EstimateMaterial[] = ["PLA", "PETG", "ABS"];

export const ESTIMATE_MATERIAL_DENSITY_G_PER_CM3: Record<
  EstimateMaterial,
  number
> = {
  PLA: PLA_DENSITY_G_PER_CM3,
  PETG: PETG_DENSITY_G_PER_CM3,
  ABS: ABS_DENSITY_G_PER_CM3,
};

export interface EstimateSettings {
  material: EstimateMaterial;
  priceUsdPerKg: number;
  flowMm3PerS: number;
}

export const DEFAULT_ESTIMATE_SETTINGS: EstimateSettings = {
  material: "PLA",
  priceUsdPerKg: FILAMENT_PRICE_USD_PER_KG,
  flowMm3PerS: EFFECTIVE_FLOW_MM3_PER_S,
};

export const sanitizeEstimateSettings = (value: unknown): EstimateSettings => {
  if (typeof value !== "object" || value === null) return DEFAULT_ESTIMATE_SETTINGS;
  const record = value as Record<string, unknown>;
  const material = ESTIMATE_MATERIALS.includes(record.material as EstimateMaterial)
    ? (record.material as EstimateMaterial)
    : DEFAULT_ESTIMATE_SETTINGS.material;
  const price = Number(record.priceUsdPerKg);
  const flow = Number(record.flowMm3PerS);
  return {
    material,
    priceUsdPerKg: Number.isFinite(price)
      ? unitMath.max(
          MIN_FILAMENT_PRICE_USD_PER_KG,
          unitMath.min(price, MAX_FILAMENT_PRICE_USD_PER_KG)
        )
      : DEFAULT_ESTIMATE_SETTINGS.priceUsdPerKg,
    flowMm3PerS: Number.isFinite(flow)
      ? unitMath.max(
          MIN_EFFECTIVE_FLOW_MM3_PER_S,
          unitMath.min(flow, MAX_EFFECTIVE_FLOW_MM3_PER_S)
        )
      : DEFAULT_ESTIMATE_SETTINGS.flowMm3PerS,
  };
};

const sineOfArcStep = unitMath.divide(
  unitMath.sqrt(unitMath.subtract(2, unitMath.sqrt(unitMath.add(2, unitMath.sqrt(2))))),
  2
);
const cornerLoss = unitMath.subtract(
  4,
  unitMath.multiply(unitMath.multiply(2, ARC_SEGMENTS), sineOfArcStep)
);

const roundedArea = (width: number, depth: number, radius: number): number =>
  unitMath.subtract(
    unitMath.multiply(width, depth),
    unitMath.multiply(cornerLoss, unitMath.multiply(radius, radius))
  );

const pocketArea = (cellSize: number, inset: number): number => {
  const side = unitMath.subtract(cellSize, unitMath.multiply(2, inset));
  const radius = unitMath.subtract(BASEPLATE_CORNER_RADIUS, inset);
  return roundedArea(side, side, radius);
};

const pocketVolume = (cellSize: number): number => {
  let volume = 0;
  for (let band = 0; band < POCKET_PROFILE.length - 1; band += 1) {
    const lower = POCKET_PROFILE[band];
    const upper = POCKET_PROFILE[band + 1];
    const middle = unitMath.divide(unitMath.add(lower.inset, upper.inset), 2);
    volume = unitMath.add(
      volume,
      unitMath.multiply(
        unitMath.divide(unitMath.subtract(upper.z, lower.z), 6),
        unitMath.add(
          unitMath.add(
            pocketArea(cellSize, lower.inset),
            unitMath.multiply(4, pocketArea(cellSize, middle))
          ),
          pocketArea(cellSize, upper.inset)
        )
      )
    );
  }
  return volume;
};

export const baseplateVolumeMm3 = (
  columns: number,
  rows: number,
  cellSize: number
): number => {
  const outlineArea = unitMath.subtract(
    unitMath.multiply(
      unitMath.multiply(unitMath.multiply(columns, cellSize), rows),
      cellSize
    ),
    unitMath.multiply(
      cornerLoss,
      unitMath.multiply(BASEPLATE_CORNER_RADIUS, BASEPLATE_CORNER_RADIUS)
    )
  );
  return unitMath.subtract(
    unitMath.multiply(outlineArea, BASEPLATE_HEIGHT_MM),
    unitMath.multiply(unitMath.multiply(columns, rows), pocketVolume(cellSize))
  );
};

const footVolume = (cellSize: number): number => {
  const area = (inset: number): number => {
    const side = unitMath.subtract(
      unitMath.subtract(cellSize, unitMath.multiply(2, BIN_GAP)),
      unitMath.multiply(2, inset)
    );
    return roundedArea(side, side, unitMath.subtract(BIN_TOP_RADIUS, inset));
  };
  let volume = 0;
  for (let band = 0; band < FOOT_PROFILE.length - 1; band += 1) {
    const lower = FOOT_PROFILE[band];
    const upper = FOOT_PROFILE[band + 1];
    const middle = unitMath.divide(unitMath.add(lower.inset, upper.inset), 2);
    volume = unitMath.add(
      volume,
      unitMath.multiply(
        unitMath.divide(unitMath.subtract(upper.z, lower.z), 6),
        unitMath.add(
          unitMath.add(area(lower.inset), unitMath.multiply(4, area(middle))),
          area(upper.inset)
        )
      )
    );
  }
  return volume;
};

const abs = (value: number): number =>
  unitMath.max(value, unitMath.multiply(value, -1));

export const binVolumeMm3 = (
  columns: number,
  rows: number,
  cellSize: number,
  height: number
): number => {
  const a = unitMath.subtract(
    unitMath.multiply(columns, cellSize),
    unitMath.multiply(2, BIN_GAP)
  );
  const b = unitMath.subtract(
    unitMath.multiply(rows, cellSize),
    unitMath.multiply(2, BIN_GAP)
  );
  const feet = unitMath.multiply(unitMath.multiply(columns, rows), footVolume(cellSize));
  const bridge = unitMath.multiply(
    roundedArea(a, b, BIN_TOP_RADIUS),
    unitMath.subtract(BIN_BASE_HEIGHT, FOOT_PROFILE[FOOT_PROFILE.length - 1].z)
  );
  const polygon = binWallProfile(height).map((point, index) =>
    index === 0 ? { ...point, z: BIN_BASE_HEIGHT } : point
  );
  let area = 0;
  let moment = 0;
  polygon.forEach((current, index) => {
    const next = polygon[(index + 1) % polygon.length];
    const crossing = unitMath.subtract(
      unitMath.multiply(current.inset, next.z),
      unitMath.multiply(next.inset, current.z)
    );
    area = unitMath.add(area, unitMath.divide(crossing, 2));
    moment = unitMath.add(
      moment,
      unitMath.divide(
        unitMath.multiply(unitMath.add(current.inset, next.inset), crossing),
        6
      )
    );
  });
  const perimeterAtWall = unitMath.subtract(
    unitMath.add(unitMath.multiply(2, a), unitMath.multiply(2, b)),
    unitMath.multiply(2, unitMath.multiply(cornerLoss, BIN_TOP_RADIUS))
  );
  const perimeterSlope = unitMath.subtract(
    unitMath.multiply(2, cornerLoss),
    8
  );
  const walls = abs(
    unitMath.add(
      unitMath.multiply(perimeterAtWall, area),
      unitMath.multiply(perimeterSlope, moment)
    )
  );
  return unitMath.add(unitMath.add(feet, bridge), walls);
};

export const spacerVolumeMm3 = (
  width: number,
  depth: number,
  height: number
): number => unitMath.multiply(unitMath.multiply(width, depth), height);

export const labelTabWidthMm = (columns: number, cellSize: number): number => {
  const outerWidth = unitMath.subtract(
    unitMath.multiply(columns, cellSize),
    unitMath.multiply(2, BIN_GAP)
  );
  return unitMath.min(
    unitMath.subtract(outerWidth, unitMath.multiply(2, LABEL_TAB_SIDE_MARGIN_MM)),
    LABEL_TAB_MAX_WIDTH_MM
  );
};

export const labelTabVolumeMm3 = (columns: number, cellSize: number): number =>
  unitMath.multiply(
    unitMath.multiply(
      labelTabWidthMm(columns, cellSize),
      LABEL_TAB_THICKNESS_MM
    ),
    unitMath.add(LABEL_TAB_ABOVE_LIP_MM, LABEL_TAB_FUSE_MM)
  );

export const dividerVolumeMm3 = (
  columns: number,
  rows: number,
  cellSize: number,
  height: number
): number =>
  unitMath.multiply(
    unitMath.multiply(
      unitMath.subtract(
        unitMath.multiply(unitMath.max(columns, rows), cellSize),
        unitMath.multiply(2, BIN_GAP)
      ),
      DIVIDER_THICKNESS_MM
    ),
    unitMath.subtract(
      unitMath.multiply(height, BIN_HEIGHT_UNIT_MM),
      BIN_BASE_HEIGHT
    )
  );

export const ringAreaMm2 = (ring: Point[]): number => {
  let area = 0;
  ring.forEach((current, index) => {
    const next = ring[(index + 1) % ring.length];
    area = unitMath.add(
      area,
      unitMath.divide(
        unitMath.subtract(
          unitMath.multiply(current[0], next[1]),
          unitMath.multiply(next[0], current[1])
        ),
        2
      )
    );
  });
  return abs(area);
};

export const magnetPocketVolumeMm3 = (): number =>
  unitMath.multiply(ringAreaMm2(magnetHoleRing()), MAGNET_HOLE_DEPTH_MM);

export const screwHoleVolumeMm3 = (depthMm: number): number =>
  unitMath.multiply(ringAreaMm2(screwHoleRing()), depthMm);

const scoopAreaAboveMm2 = (height: number): number => {
  const top = scoopTopZMm(height);
  const polygon = binWallProfile(height).map((point, index) =>
    index === 0 ? { ...point, z: BIN_BASE_HEIGHT } : point
  );
  const clipped: ProfilePoint[] = [];
  polygon.forEach((current, index) => {
    const next = polygon[(index + 1) % polygon.length];
    if (current.z >= top) clipped.push(current);
    if ((current.z >= top) !== (next.z >= top)) {
      const fraction = unitMath.divide(
        unitMath.subtract(top, current.z),
        unitMath.subtract(next.z, current.z)
      );
      clipped.push({
        inset: unitMath.add(
          current.inset,
          unitMath.multiply(fraction, unitMath.subtract(next.inset, current.inset))
        ),
        z: top,
      });
    }
  });
  let area = 0;
  clipped.forEach((current, index) => {
    const next = clipped[(index + 1) % clipped.length];
    area = unitMath.add(
      area,
      unitMath.divide(
        unitMath.subtract(
          unitMath.multiply(current.inset, next.z),
          unitMath.multiply(next.inset, current.z)
        ),
        2
      )
    );
  });
  return abs(area);
};

export const scoopVolumeMm3 = (
  columns: number,
  cellSize: number,
  height: number
): number =>
  unitMath.multiply(
    scoopAreaAboveMm2(height),
    unitMath.multiply(
      unitMath.multiply(columns, cellSize),
      unitMath.subtract(SCOOP_SPAN_END_FRACTION, SCOOP_SPAN_START_FRACTION)
    )
  );

export const lidLipVolumeMm3 = (width: number, depth: number): number => {
  const outerInset = unitMath.add(
    STACKING_LIP_INNER_INSET_MM,
    LID_LIP_CLEARANCE_MM
  );
  const outerRadius = unitMath.subtract(
    unitMath.subtract(BIN_TOP_RADIUS, STACKING_LIP_INNER_INSET_MM),
    LID_LIP_CLEARANCE_MM
  );
  const innerRadius = unitMath.subtract(outerRadius, LID_LIP_THICKNESS_MM);
  const outerArea = roundedArea(
    unitMath.subtract(width, unitMath.multiply(2, outerInset)),
    unitMath.subtract(depth, unitMath.multiply(2, outerInset)),
    outerRadius
  );
  const innerArea = roundedArea(
    unitMath.subtract(
      width,
      unitMath.multiply(2, unitMath.add(outerInset, LID_LIP_THICKNESS_MM))
    ),
    unitMath.subtract(
      depth,
      unitMath.multiply(2, unitMath.add(outerInset, LID_LIP_THICKNESS_MM))
    ),
    innerRadius
  );
  return unitMath.multiply(
    unitMath.subtract(outerArea, innerArea),
    LID_LIP_DEPTH_MM
  );
};

export const lidVolumeMm3 = (width: number, depth: number): number =>
  unitMath.add(
    unitMath.multiply(
      unitMath.multiply(width, depth),
      LID_THICKNESS_MM
    ),
    lidLipVolumeMm3(width, depth)
  );

export const partVolumeMm3 = (part: PrintPartSummary): number => {
  if (part.kind === "bin" && part.binGeometry) {
    let bin = binVolumeMm3(
      part.binGeometry.columns,
      part.binGeometry.rows,
      part.binGeometry.cellSize,
      part.binGeometry.height
    );
    if (part.binGeometry.labelTab) {
      bin = unitMath.add(
        bin,
        labelTabVolumeMm3(part.binGeometry.columns, part.binGeometry.cellSize)
      );
    }
    if (part.binGeometry.dividerCount) {
      bin = unitMath.add(
        bin,
        unitMath.multiply(
          dividerVolumeMm3(
            part.binGeometry.columns,
            part.binGeometry.rows,
            part.binGeometry.cellSize,
            part.binGeometry.height
          ),
          part.binGeometry.dividerCount
        )
      );
    }
    if (part.binGeometry.magnetHoles) {
      bin = unitMath.subtract(
        bin,
        unitMath.multiply(
          magnetPocketVolumeMm3(),
          magnetHoleCount(part.binGeometry.columns, part.binGeometry.rows)
        )
      );
    }
    if (part.binGeometry.screwHoles) {
      bin = unitMath.subtract(
        bin,
        unitMath.multiply(
          screwHoleVolumeMm3(
            part.binGeometry.magnetHoles
              ? unitMath.subtract(BIN_BASE_HEIGHT, MAGNET_HOLE_DEPTH_MM)
              : BIN_BASE_HEIGHT
          ),
          screwHoleCount(part.binGeometry.columns, part.binGeometry.rows)
        )
      );
    }
    if (part.binGeometry.scoop) {
      bin = unitMath.subtract(
        bin,
        scoopVolumeMm3(
          part.binGeometry.columns,
          part.binGeometry.cellSize,
          part.binGeometry.height
        )
      );
    }
    return bin;
  }
  if (part.kind === "baseplate" && part.gridGeometry) {
    return baseplateVolumeMm3(
      part.gridGeometry.columns,
      part.gridGeometry.rows,
      part.gridGeometry.cellSize
    );
  }
  if (part.kind === "lid") {
    return lidVolumeMm3(part.width, part.depth);
  }
  return spacerVolumeMm3(part.width, part.depth, part.height);
};

export interface PrintEstimate {
  volumeMm3: number;
  grams: number;
  minutes: number;
  costUsd: number;
}

export const estimatePrint = (
  parts: PrintPartSummary[],
  settings: EstimateSettings = DEFAULT_ESTIMATE_SETTINGS
): PrintEstimate => {
  const volumeMm3 = parts.reduce(
    (sum, part) =>
      unitMath.add(sum, unitMath.multiply(partVolumeMm3(part), part.count)),
    0
  );
  const grams = unitMath.divide(
    unitMath.multiply(volumeMm3, ESTIMATE_MATERIAL_DENSITY_G_PER_CM3[settings.material]),
    MM3_PER_CM3
  );
  const minutes = unitMath.divide(
    volumeMm3,
    unitMath.multiply(settings.flowMm3PerS, 60)
  );
  const costUsd = unitMath.divide(
    unitMath.multiply(grams, settings.priceUsdPerKg),
    GRAMS_PER_KG
  );
  return { volumeMm3, grams, minutes, costUsd };
};

export const formatEstimateDuration = (minutes: number): string => {
  const total = unitMath.round(minutes, 0);
  if (total < 60) return `${total} min`;
  const hours = unitMath.floor(unitMath.divide(total, 60));
  const rest = unitMath.subtract(total, unitMath.multiply(hours, 60));
  return `${hours} h ${rest} min`;
};

export const formatEstimateGrams = (grams: number): string =>
  `${unitMath.round(grams, 0)} g`;

export const formatEstimateCost = (costUsd: number): string => {
  const cents = unitMath.round(unitMath.multiply(costUsd, 100), 0);
  const dollars = unitMath.floor(unitMath.divide(cents, 100));
  const remainder = unitMath.subtract(cents, unitMath.multiply(dollars, 100));
  return `$${dollars}.${remainder < 10 ? `0${remainder}` : `${remainder}`}`;
};
