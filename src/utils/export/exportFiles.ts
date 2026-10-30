import { unitMath } from "@/services/unitMath";
import { drawerSizeMm, formatDrawerSize, formatSize, pluralize } from "@/utils/format";
import { PLATE_GAP_MM, planPlates, usableBed, type Plate } from "@/utils/printPlan";
import {
  collectPrintParts,
  mergeTestFitParts,
  slug,
  testFitParts,
  type PrintPartSummary,
} from "@/utils/printParts";
import type { Bin, DrawerSize, LayoutItem, PrinterSize } from "@/types";
import { baseplateMesh, spacerMesh } from "./gridfinityMesh";
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
  testFit?: boolean;
  labelTabs?: boolean;
  dividers?: boolean;
}

export interface ExportBundle {
  filename: string;
  data: Uint8Array;
  parts: number;
  plates: number;
  prints: number;
  skippedBins: number;
}

const pad = (text: string, width: number): string => text.padEnd(width, " ");

const trim = (value: number): string => String(unitMath.round(value, 2));

const describePlate = (plate: Plate, labels: Map<string, string>): string =>
  plate.parts.map(({ key, count }) => `${count} × ${labels.get(key)}`).join(", ");

export const createPrintFiles = (request: ExportRequest): ExportBundle => {
  const { parts, skippedBins } = collectPrintParts({
    layout: request.layout,
    bins: request.bins,
    numDrawers: request.numDrawers,
    printerSize: request.printerSize,
    labelTabs: request.labelTabs,
    dividers: request.dividers,
  });
  if (parts.length === 0) throw new Error("There is nothing to print yet");

  const testParts = request.testFit ? testFitParts(parts) : [];
  const exportParts = mergeTestFitParts(parts, testParts);
  const testMembers = testParts.flatMap((testPart) => {
    const merged = exportParts.find((part) => part.stem === testPart.stem);
    return merged
      ? [{ key: merged.key, width: merged.width, depth: merged.depth, count: 1 }]
      : [];
  });
  const testPlate =
    testMembers.length > 0
      ? (planPlates(testMembers, request.printerSize)[0] ?? null)
      : null;

  const meshes = new Map<string, Mesh>();
  const meshFor = (part: PrintPartSummary): Mesh => {
    const cached = meshes.get(part.key);
    if (cached) return cached;
    let mesh: Mesh;
    if (part.binGeometry) {
      mesh = binMesh(part.binGeometry);
    } else if (part.kind === "spacer") {
      mesh = spacerMesh(part.width, part.depth);
    } else if (part.gridGeometry) {
      mesh = baseplateMesh(
        part.gridGeometry.columns,
        part.gridGeometry.rows,
        part.gridGeometry.cellSize
      );
    } else {
      throw new Error(`No geometry for ${part.key}`);
    }
    meshes.set(part.key, mesh);
    return mesh;
  };

  const entries: ZipEntry[] = [];
  const files = new Map<string, string>();
  for (const part of exportParts) {
    const file = `stl/${part.stem}-x${part.count}.stl`;
    files.set(part.key, file);
    entries.push([file, meshToStl(meshFor(part), part.label)]);
  }

  const byKey = new Map(exportParts.map((part) => [part.key, part]));
  const labels = new Map(exportParts.map((part) => [part.key, part.label]));
  const plan = (kind: "grid" | "bin", members: PrintPartSummary[]) =>
    planPlates(
      members.map(({ key, width, depth, count }) => ({ key, width, depth, count })),
      request.printerSize
    ).map((plate) => ({ kind, plate }));
  const grid = parts.filter((part) => part.kind !== "bin");
  const bins = parts.filter((part) => part.kind === "bin");
  const mainPlates = [...plan("grid", grid), ...plan("bin", bins)];
  const plates = [
    ...(testPlate ? [{ kind: "grid" as const, plate: testPlate, number: 0 }] : []),
    ...mainPlates.map((entry, index) => ({
      ...entry,
      number: unitMath.add(index, 1),
    })),
  ];

  const plateLines: string[] = [];
  plates.forEach(({ kind, plate, number }) => {
    const copies = plate.copies > 1 ? `-x${plate.copies}` : "";
    const file =
      number === 0
        ? "3mf/plate-0-test-fit.3mf"
        : `3mf/plate-${number}-${kind === "bin" ? "bins" : "baseplates"}${copies}.3mf`;
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
        title:
          number === 0
            ? "Gridfinity test fit plate"
            : `Gridfinity plate ${number} of ${plates.length}`,
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
  const partLines = exportParts.map((part) => {
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
    bins.length > 0 &&
      request.labelTabs &&
      "- Label tabs: every bin has a raised tab above the stacking lip for a stuck-on label; another bin cannot stack on top of a tabbed bin.",
    bins.length > 0 &&
      request.dividers &&
      "- Dividers: every bin has one divider down the middle of its long side, from the bin floor up to the top of the bin units, below the stacking lip so bins still stack.",
    bins.some((part) => part.label.includes("half-grid")) &&
      "- Bins marked half-grid feet sit on half-size baseplates.",
    skippedBins > 0 &&
      `- ${pluralize(skippedBins, "bin")} that ${skippedBins === 1 ? "doesn't" : "don't"} fit the grid or the printer ${skippedBins === 1 ? "was" : "were"} left out.`,
    testPlate &&
      `- Test fit first: print the test-fit plate first (${describePlate(testPlate, labels)}) to check the fit before the rest.`,
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
    parts: exportParts.length,
    plates: plates.length,
    prints,
    skippedBins,
  };
};
