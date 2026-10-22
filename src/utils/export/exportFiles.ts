import { unitMath } from "@/services/unitMath";
import { FULL_GRID_SIZE, HALF_GRID_SIZE } from "@/utils/gridfinityUtils";
import { drawerSizeMm, formatDrawerSize, formatSize, pluralize } from "@/utils/format";
import {
  binIssues,
  binOuterSize,
  binSizeLabel,
  gridCells,
  groupBins,
  indexCells,
  maxBinHeight,
} from "@/utils/bins";
import { PLATE_GAP_MM, planPlates, usableBed, type Plate } from "@/utils/printPlan";
import type { Bin, DrawerSize, LayoutItem, PrinterSize } from "@/types";
import { BASEPLATE_HEIGHT, baseplateMesh, spacerMesh } from "./gridfinityMesh";
import { binMesh } from "./binMesh";
import { meshToStl } from "./stl";
import { createThreeMf, quarterTurn, translation } from "./threeMf";
import { createZip, type ZipEntry } from "./zip";
import type { Mesh } from "./mesh";

export interface ExportRequest {
  layout: LayoutItem[];
  bins: Bin[];
  numDrawers: number;
  drawerSize: DrawerSize;
  useMm: boolean;
  printerName: string;
  printerSize: PrinterSize;
}

export interface ExportBundle {
  filename: string;
  data: Uint8Array;
  parts: number;
  plates: number;
  prints: number;
  skippedBins: number;
}

type PartKind = "bin" | "baseplate" | "spacer";

interface PrintPart {
  key: string;
  kind: PartKind;
  label: string;
  stem: string;
  width: number;
  depth: number;
  height: number;
  count: number;
  mesh: () => Mesh;
}

const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/\s*×\s*/g, "x")
    .replace(/(\d)\s+(mm|in)\b/g, "$1$2")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

const trim = (value: number): string => String(unitMath.round(value, 2));

const binParts = (request: ExportRequest): { parts: PrintPart[]; skipped: number } => {
  const index = indexCells(gridCells(request.layout));
  const bed = usableBed(request.printerSize);
  const limits = { ...bed, height: maxBinHeight(request.printerSize.z) };
  const skipped = binIssues(request.bins, index, limits).size;
  const parts = groupBins(request.bins, index, limits).map((group): PrintPart => {
    const half = group.cellSize === HALF_GRID_SIZE;
    const size = binSizeLabel(group);
    const label = `Bin ${size} · ${group.height}u${half ? " · half-grid feet" : ""}`;
    const outer = binOuterSize(group);
    return {
      key: group.key,
      kind: "bin",
      label,
      stem: slug(`bin ${size} ${group.height}u${half ? " half grid" : ""}`),
      width: outer.width,
      depth: outer.depth,
      height: outer.height,
      count: unitMath.multiply(group.bins.length, request.numDrawers),
      mesh: () =>
        binMesh({
          columns: unitMath.round(unitMath.divide(group.width, group.cellSize), 0),
          rows: unitMath.round(unitMath.divide(group.depth, group.cellSize), 0),
          cellSize: group.cellSize,
          height: group.height,
        }),
    };
  });
  return { parts, skipped };
};

const gridParts = (request: ExportRequest): PrintPart[] => {
  const groups = new Map<string, { item: LayoutItem; count: number }>();
  for (const item of request.layout) {
    const key = `${item.type}:${unitMath.round(item.pixelWidth, 2)}x${unitMath.round(item.pixelHeight, 2)}`;
    const group = groups.get(key);
    if (group) {
      group.count = unitMath.add(group.count, 1);
    } else {
      groups.set(key, { item, count: 1 });
    }
  }
  return [...groups].map(([key, { item, count }]): PrintPart => {
    const width = item.pixelWidth;
    const depth = item.pixelHeight;
    const total = unitMath.multiply(count, request.numDrawers);
    if (item.type === "spacer") {
      const label = `Spacer ${trim(width)} × ${trim(depth)} mm`;
      return {
        key,
        kind: "spacer",
        label,
        stem: slug(label),
        width,
        depth,
        height: BASEPLATE_HEIGHT,
        count: total,
        mesh: () => spacerMesh(width, depth),
      };
    }
    const cellSize = item.type === "half-size" ? HALF_GRID_SIZE : FULL_GRID_SIZE;
    const columns = unitMath.round(unitMath.divide(width, cellSize), 0);
    const rows = unitMath.round(unitMath.divide(depth, cellSize), 0);
    const label = `${item.type === "half-size" ? "Half-size baseplate" : "Baseplate"} ${columns} × ${rows}`;
    return {
      key,
      kind: "baseplate",
      label,
      stem: slug(label),
      width,
      depth,
      height: BASEPLATE_HEIGHT,
      count: total,
      mesh: () => baseplateMesh(columns, rows, cellSize),
    };
  });
};

const pad = (text: string, width: number): string => text.padEnd(width, " ");

const describePlate = (plate: Plate, labels: Map<string, string>): string =>
  plate.parts.map(({ key, count }) => `${count} × ${labels.get(key)}`).join(", ");

export const createPrintFiles = (request: ExportRequest): ExportBundle => {
  const { parts: bins, skipped } = binParts(request);
  const grid = gridParts(request);
  const parts = [...bins, ...grid];
  if (parts.length === 0) throw new Error("There is nothing to print yet");

  const meshes = new Map<string, Mesh>();
  const meshFor = (part: PrintPart): Mesh => {
    const cached = meshes.get(part.key);
    if (cached) return cached;
    const mesh = part.mesh();
    meshes.set(part.key, mesh);
    return mesh;
  };

  const entries: ZipEntry[] = [];
  const files = new Map<string, string>();
  for (const part of parts) {
    const file = `stl/${part.stem}-x${part.count}.stl`;
    files.set(part.key, file);
    entries.push([file, meshToStl(meshFor(part), part.label)]);
  }

  const byKey = new Map(parts.map((part) => [part.key, part]));
  const labels = new Map(parts.map((part) => [part.key, part.label]));
  const plan = (kind: "grid" | "bin", members: PrintPart[]) =>
    planPlates(
      members.map(({ key, width, depth, count }) => ({ key, width, depth, count })),
      request.printerSize
    ).map((plate) => ({ kind, plate }));
  const plates = [...plan("grid", grid), ...plan("bin", bins)];

  const plateLines: string[] = [];
  plates.forEach(({ kind, plate }, index) => {
    const number = unitMath.add(index, 1);
    const copies = plate.copies > 1 ? `-x${plate.copies}` : "";
    const file = `3mf/plate-${number}-${kind === "bin" ? "bins" : "baseplates"}${copies}.3mf`;
    const members = plate.parts.flatMap(({ key }) => {
      const part = byKey.get(key);
      return part ? [part] : [];
    });
    const keys = members.map((part) => part.key);
    const objects = members.map((part) => ({ name: part.label, mesh: meshFor(part) }));
    const items = plate.placements.map((placement) => ({
      object: keys.indexOf(placement.key),
      transform: placement.rotated
        ? quarterTurn(unitMath.add(placement.x, placement.width), placement.y)
        : translation(placement.x, placement.y),
    }));
    entries.push([
      file,
      createThreeMf({
        title: `Gridfinity plate ${number} of ${plates.length}`,
        objects,
        items,
      }),
      { store: true },
    ]);
    plateLines.push(
      `  ${pad(file, 36)} ${pad(plate.copies === 1 ? "print once" : `print ${plate.copies} times`, 16)} ${describePlate(plate, labels)}`
    );
  });

  const drawer = drawerSizeMm(request.drawerSize);
  const prints = plates.reduce((sum, { plate }) => unitMath.add(sum, plate.copies), 0);
  const drawers =
    request.numDrawers > 1 ? `${request.numDrawers} identical drawers` : "1 drawer";
  const bed = usableBed(request.printerSize);
  const partLines = parts.map((part) => {
    const size = `${formatSize(part.width, part.depth, true).replace(/ mm$/, "")} × ${trim(part.height)} mm`;
    return `  ${pad(String(part.count), 6)} ${pad(part.label, 36)} ${pad(size, 26)} ${files.get(part.key)}`;
  });
  const notes = [
    "- Baseplates follow the Gridfinity spec: 42 mm grid, 5 mm tall, open frame, no magnet holes.",
    grid.some((part) => part.label.startsWith("Half-size")) &&
      "- Half-size baseplates are the same frame on a 21 mm grid.",
    grid.some((part) => part.kind === "spacer") &&
      "- Spacers are solid 5 mm blocks that fill the gap between the grid and the drawer wall.",
    bins.length > 0 &&
      "- Bins follow the Gridfinity spec: 7 mm height units plus a stacking lip, 0.95 mm walls, no magnet holes.",
    bins.some((part) => part.label.includes("half-grid")) &&
      "- Bins marked half-grid feet sit on half-size baseplates.",
    skipped > 0 &&
      `- ${pluralize(skipped, "bin")} that ${skipped === 1 ? "doesn't" : "don't"} fit the grid or the printer ${skipped === 1 ? "was" : "were"} left out.`,
    "- Print the bin labels from the Bin labels section of the page.",
  ].filter(Boolean);

  const readme = [
    "Gridfinity Layout: print files",
    "",
    `Drawer: ${formatDrawerSize(request.drawerSize, false)} (${formatSize(drawer.width, drawer.height, true)}), ${drawers}`,
    `Printer: ${request.printerName}, ${trim(bed.width)} × ${trim(bed.depth)} mm printable area, ${request.printerSize.z} mm tall`,
    "",
    `Parts for ${drawers}. The STL file names end with how many to print.`,
    "",
    `  ${pad("Count", 6)} ${pad("Part", 36)} ${pad("Size", 26)} STL file`,
    ...partLines,
    "",
    `Print plates (3MF): ${pluralize(plates.length, "file")}, ${pluralize(prints, "print")} in total, laid out for the ${request.printerName} with ${PLATE_GAP_MM} mm between parts.`,
    "",
    ...plateLines,
    "",
    "Notes",
    ...notes,
    "",
    "Made with Gridfinity Layout, https://gridfinitylayout.com/",
    "",
  ].join("\n");

  const drawerSlug = slug(formatDrawerSize(request.drawerSize, request.useMm));
  return {
    filename: `gridfinity-${drawerSlug}${request.numDrawers > 1 ? `-x${request.numDrawers}` : ""}.zip`,
    data: createZip([["README.txt", readme], ...entries]),
    parts: parts.length,
    plates: plates.length,
    prints,
    skippedBins: skipped,
  };
};
