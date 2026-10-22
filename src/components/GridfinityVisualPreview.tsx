import React, { useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ChevronDown, X } from "lucide-react";
import { unitMath } from "@/services/unitMath";
import { cn } from "@/lib/utils";
import { drawerSizeMm, formatLength, formatSize } from "@/utils/format";
import {
  getPreviewPieceDetails,
  groupPreviewPieces,
  previewPieceKey,
  previewCellSize,
} from "@/utils/previewPieceDetails";
import {
  DEFAULT_BIN_HEIGHT,
  binIssues,
  binOuterSize,
  binSizeLabel,
  binStep,
  canPlace,
  cellAt,
  createBinId,
  fillEmpty,
  findFreeSpot,
  fitsBed,
  gridCells,
  groupBins,
  indexCells,
  maxBinHeight,
  placeBin,
  snapMove,
  snapResize,
  spanRect,
  type BinLimits,
  type CellIndex,
  type Rect,
} from "@/utils/bins";
import { usableBed } from "@/utils/printPlan";
import { useBinHistory } from "@/hooks/useBinHistory";
import BinDetails from "./BinDetails";
import BinToolbar from "./BinToolbar";
import PieceSwatch from "./PieceSwatch";
import { PIECE_TYPE_CLASS } from "@/utils/pieceStyles";
import type { Bin, DrawerSize, GridCell, LayoutItem, PrinterSize } from "@/types";

interface GridfinityVisualPreviewProps {
  layout: LayoutItem[];
  drawerSize: DrawerSize;
  useMm: boolean;
  numDrawers?: number;
  bins: Bin[];
  onBinsChange: Dispatch<SetStateAction<Bin[]>>;
  printerSize: PrinterSize;
}

type Gesture =
  | { kind: "draw"; pointerId: number; anchor: GridCell; current: GridCell }
  | {
      kind: "move";
      pointerId: number;
      bin: Bin;
      offsetX: number;
      offsetY: number;
      startX: number;
      startY: number;
      moved: boolean;
    }
  | { kind: "resize"; pointerId: number; bin: Bin; startX: number; startY: number; moved: boolean };

interface Draft {
  rect: Rect;
  valid: boolean;
  binId: string | null;
}

const TYPE_ORDER: LayoutItem["type"][] = ["baseplate", "half-size", "spacer"];
const LEGEND_LABELS: Record<LayoutItem["type"], string> = {
  baseplate: "Baseplate",
  "half-size": "Half-size baseplate",
  spacer: "Spacer",
};
const DRAG_THRESHOLD_PX = 4;
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const percent = (part: number, whole: number): string =>
  `${unitMath.multiply(unitMath.divide(part, whole), 100)}%`;

const magnitude = (value: number): number => unitMath.max(value, unitMath.multiply(value, -1));

const useFreeSpace = (
  cells: GridCell[],
  index: CellIndex,
  bins: Bin[],
  limits: BinLimits,
  step: number,
  fillWidth: number,
  fillDepth: number
) => {
  const firstFree = useMemo(
    () => findFreeSpot(cells, index, bins, step, step),
    [cells, index, bins, step]
  );
  const canFill = useMemo(
    () =>
      fitsBed({ width: fillWidth, depth: fillDepth }, limits) &&
      findFreeSpot(cells, index, bins, fillWidth, fillDepth) !== null,
    [cells, index, bins, limits, fillWidth, fillDepth]
  );
  return { firstFree, canFill };
};

const GridfinityVisualPreview: React.FC<GridfinityVisualPreviewProps> = ({
  layout,
  drawerSize,
  useMm,
  numDrawers = 1,
  bins,
  onBinsChange,
  printerSize,
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);
  const [draft, setDraftState] = useState<Draft | null>(null);
  const [lastHeight, setLastHeight] = useState(DEFAULT_BIN_HEIGHT);
  const [prevLayout, setPrevLayout] = useState(layout);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const binRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const floorRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const draftRef = useRef<Draft | null>(null);
  const history = useBinHistory(bins, onBinsChange);

  if (layout !== prevLayout) {
    setPrevLayout(layout);
    setSelectedKey(null);
    setHoverKey(null);
  }

  const setDraft = (next: Draft | null) => {
    draftRef.current = next;
    setDraftState(next);
  };

  const groups = useMemo(() => groupPreviewPieces(layout), [layout]);
  const presentTypes = TYPE_ORDER.filter((type) =>
    groups.some((group) => group.item.type === type)
  );
  const drawerMm = useMemo(() => drawerSizeMm(drawerSize), [drawerSize]);
  const cells = useMemo(() => gridCells(layout), [layout]);
  const index = useMemo(() => indexCells(cells), [cells]);
  const maxHeight = maxBinHeight(printerSize.z);
  const limits = useMemo(
    () => ({ ...usableBed(printerSize), height: maxBinHeight(printerSize.z) }),
    [printerSize]
  );
  const issues = useMemo(() => binIssues(bins, index, limits), [bins, index, limits]);
  const binGroups = useMemo(() => groupBins(bins, index, limits), [bins, index, limits]);
  const binGroupKey = useMemo(() => {
    const keys = new Map<string, string>();
    binGroups.forEach((group) => group.bins.forEach((bin) => keys.set(bin.id, group.key)));
    return keys;
  }, [binGroups]);
  const selectedBin = bins.find((bin) => bin.id === selectedBinId) ?? null;
  const baseStep = cells[0]?.size ?? 42;
  const newHeight = unitMath.min(lastHeight, maxHeight);

  const pieces = useMemo(() => {
    const labels = new Map(
      groups.map((group) => [
        previewPieceKey(group.item),
        getPreviewPieceDetails(group.item, layout).gridLabel.replace(/ /g, ""),
      ])
    );
    return layout.map((item) => {
      const key = previewPieceKey(item);
      const size = previewCellSize(item);
      return {
        item,
        key,
        label: item.type === "spacer" ? null : labels.get(key),
        slotStyle: {
          left: percent(item.pixelX, drawerMm.width),
          top: percent(item.pixelY, drawerMm.height),
          width: percent(item.pixelWidth, drawerMm.width),
          height: percent(item.pixelHeight, drawerMm.height),
        },
        cellStyle: {
          "--cell-w": `calc(100% / ${unitMath.divide(item.pixelWidth, size)})`,
          "--cell-h": `calc(100% / ${unitMath.divide(item.pixelHeight, size)})`,
        } as React.CSSProperties,
      };
    });
  }, [layout, groups, drawerMm]);

  const rectStyle = (rect: Rect): React.CSSProperties => ({
    left: percent(rect.x, drawerMm.width),
    top: percent(rect.y, drawerMm.height),
    width: percent(rect.width, drawerMm.width),
    height: percent(rect.depth, drawerMm.height),
  });

  const fits = (rect: Rect, ignoreId?: string) =>
    canPlace(rect, index, bins, ignoreId) && fitsBed(rect, limits);

  const focusBin = (id: string) =>
    requestAnimationFrame(() => binRefs.current[id]?.focus({ preventScroll: true }));

  const addBin = (rect: Rect, focus = false) => {
    const bin: Bin = { id: createBinId(), ...rect, height: newHeight, label: "" };
    history.commit([...bins, bin]);
    setSelectedBinId(bin.id);
    setSelectedKey(null);
    if (focus) focusBin(bin.id);
  };

  const updateBin = (next: Bin) => {
    history.commit(bins.map((bin) => (bin.id === next.id ? next : bin)));
    const previous = bins.find((bin) => bin.id === next.id);
    if (previous && next.height !== previous.height) setLastHeight(next.height);
  };

  const deleteBin = (id: string, focusNext = false) => {
    const position = bins.findIndex((bin) => bin.id === id);
    const remaining = bins.filter((bin) => bin.id !== id);
    history.commit(remaining);
    setSelectedBinId(null);
    if (focusNext && remaining.length > 0) {
      focusBin(remaining[unitMath.min(position, unitMath.subtract(remaining.length, 1))].id);
    }
  };

  const duplicateBin = (bin: Bin) => {
    const spot = findFreeSpot(cells, index, bins, bin.width, bin.depth);
    if (!spot) return;
    const copy: Bin = { ...bin, ...spot, id: createBinId() };
    history.commit([...bins, copy]);
    setSelectedBinId(copy.id);
  };

  const template = selectedBin
    ? { width: selectedBin.width, depth: selectedBin.depth, height: selectedBin.height, label: "" }
    : { width: baseStep, depth: baseStep, height: newHeight, label: "" };
  const { firstFree, canFill } = useFreeSpace(
    cells,
    index,
    bins,
    limits,
    baseStep,
    selectedBin ? selectedBin.width : baseStep,
    selectedBin ? selectedBin.depth : baseStep
  );

  const handleAdd = () => {
    if (firstFree) addBin({ ...firstFree, width: baseStep, depth: baseStep }, true);
  };

  const handleFill = () => {
    const added = fillEmpty(cells, index, bins, template);
    if (added.length > 0) history.commit([...bins, ...added]);
  };

  const handleClear = () => {
    history.commit([]);
    setSelectedBinId(null);
  };

  const pointerMm = (event: React.PointerEvent) => {
    const box = floorRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return { x: 0, y: 0 };
    return {
      x: unitMath.multiply(
        unitMath.divide(unitMath.subtract(event.clientX, box.left), box.width),
        drawerMm.width
      ),
      y: unitMath.multiply(
        unitMath.divide(unitMath.subtract(event.clientY, box.top), box.height),
        drawerMm.height
      ),
    };
  };

  const begin = (event: React.PointerEvent, next: Gesture) => {
    gesture.current = next;
    floorRef.current?.setPointerCapture?.(event.pointerId);
  };

  const handleFloorPointerDown = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const point = pointerMm(event);
    const cell = cellAt(index, point.x, point.y);
    if (!cell) {
      setSelectedBinId(null);
      return;
    }
    begin(event, { kind: "draw", pointerId: event.pointerId, anchor: cell, current: cell });
    const rect = spanRect(cell, cell);
    setDraft({ rect, valid: fits(rect), binId: null });
  };

  const handleBinPointerDown = (event: React.PointerEvent, bin: Bin) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const wasSelected = selectedBinId === bin.id;
    setSelectedBinId(bin.id);
    setSelectedKey(null);
    if (event.pointerType === "touch" && !wasSelected) return;
    const point = pointerMm(event);
    begin(event, {
      kind: "move",
      pointerId: event.pointerId,
      bin,
      offsetX: unitMath.subtract(point.x, bin.x),
      offsetY: unitMath.subtract(point.y, bin.y),
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    });
  };

  const handleResizePointerDown = (event: React.PointerEvent, bin: Bin) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    begin(event, {
      kind: "resize",
      pointerId: event.pointerId,
      bin,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    });
  };

  const travelledFrom = (event: React.PointerEvent, startX: number, startY: number) =>
    unitMath.add(
      magnitude(unitMath.subtract(event.clientX, startX)),
      magnitude(unitMath.subtract(event.clientY, startY))
    );

  const handlePointerMove = (event: React.PointerEvent) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const point = pointerMm(event);
    if (current.kind === "draw") {
      const cell = cellAt(index, point.x, point.y);
      if (!cell || (cell.x === current.current.x && cell.y === current.current.y)) return;
      current.current = cell;
      const rect = spanRect(current.anchor, cell);
      setDraft({ rect, valid: fits(rect), binId: null });
    } else if (current.kind === "move") {
      if (!current.moved) {
        if (travelledFrom(event, current.startX, current.startY) < DRAG_THRESHOLD_PX) return;
        current.moved = true;
      }
      const snapped = snapMove(
        index,
        bins,
        current.bin,
        unitMath.subtract(point.x, current.offsetX),
        unitMath.subtract(point.y, current.offsetY)
      );
      setDraft({ rect: snapped, valid: snapped.valid, binId: current.bin.id });
    } else {
      if (!current.moved) {
        if (travelledFrom(event, current.startX, current.startY) < DRAG_THRESHOLD_PX) return;
        current.moved = true;
      }
      const snapped = snapResize(
        index,
        bins,
        current.bin,
        unitMath.subtract(point.x, current.bin.x),
        unitMath.subtract(point.y, current.bin.y)
      );
      setDraft({
        rect: snapped,
        valid: snapped.valid && fitsBed(snapped, limits),
        binId: current.bin.id,
      });
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null;
    const pending = draftRef.current;
    setDraft(null);
    if (current.kind === "resize" && !current.moved) {
      const point = pointerMm(event);
      const cell = cellAt(index, point.x, point.y);
      const rect = cell ? spanRect(cell, cell) : null;
      if (rect && fits(rect)) addBin(rect);
      return;
    }
    if (!pending?.valid) return;
    if (current.kind === "draw") {
      addBin(pending.rect);
      return;
    }
    if (current.kind === "move" && !current.moved) return;
    const { x, y, width, depth } = pending.rect;
    if (
      x === current.bin.x &&
      y === current.bin.y &&
      width === current.bin.width &&
      depth === current.bin.depth
    ) {
      return;
    }
    updateBin({ ...current.bin, x, y, width, depth });
  };

  const handlePointerCancel = () => {
    gesture.current = null;
    setDraft(null);
  };

  const handleBinKeyDown = (event: React.KeyboardEvent, bin: Bin) => {
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      deleteBin(bin.id, true);
      return;
    }
    if (event.key === "Escape") {
      setSelectedBinId(null);
      return;
    }
    const arrow = ARROWS[event.key];
    if (!arrow) return;
    event.preventDefault();
    setSelectedBinId(bin.id);
    const step = binStep(bin, index, baseStep);
    const [dx, dy] = arrow;
    const rect = event.shiftKey
      ? {
          x: bin.x,
          y: bin.y,
          width: unitMath.add(bin.width, unitMath.multiply(dx, step)),
          depth: unitMath.add(bin.depth, unitMath.multiply(dy, step)),
        }
      : {
          x: unitMath.add(bin.x, unitMath.multiply(dx, step)),
          y: unitMath.add(bin.y, unitMath.multiply(dy, step)),
          width: bin.width,
          depth: bin.depth,
        };
    if (rect.width < step || rect.depth < step) return;
    const next = placeBin(bin, rect, index, bins, limits);
    if (next) updateBin(next);
  };

  const handleEditorKeyDown = (event: React.KeyboardEvent) => {
    if ((event.target as HTMLElement).closest("input, textarea")) return;
    if (!(event.metaKey || event.ctrlKey)) return;
    const key = event.key.toLowerCase();
    if (key === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        history.redo();
      } else {
        history.undo();
      }
    } else if (key === "y") {
      event.preventDefault();
      history.redo();
    }
  };

  const toggle = (key: string) =>
    setSelectedKey((current) => (current === key ? null : key));

  const clearSelection = (key: string) => {
    setSelectedKey(null);
    rowRefs.current[key]?.querySelector("button")?.focus();
  };

  const hoverWithMouse =
    (key: string | null) => (event: React.PointerEvent) => {
      if (event.pointerType === "mouse") setHoverKey(key);
    };

  if (layout.length === 0) {
    return (
      <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No pieces fit yet. Enter your drawer&apos;s inside width and depth.
      </p>
    );
  }

  const ratio = unitMath.divide(drawerSize.width, drawerSize.height);
  const pieceSelected = selectedKey !== null && !selectedKey.startsWith("bin:");
  const binGroupSelected = selectedKey !== null && selectedKey.startsWith("bin:");
  const binGap = `max(1.5px, ${percent(0.25, drawerMm.width)})`;

  return (
    <div className="space-y-6">
      <div className="space-y-3" onKeyDown={handleEditorKeyDown}>
        <BinToolbar
          hasBins={bins.length > 0}
          fillLabel={`Fill with ${binSizeLabel(template)}`}
          canAdd={firstFree !== null}
          canFill={canFill}
          history={history}
          onAdd={handleAdd}
          onFill={handleFill}
          onClear={handleClear}
        />
        <figure className="space-y-3" data-tour="results">
          <h3 className="sr-only">Drawer layout</h3>
          <div
            className="mx-auto w-full"
            style={{ maxWidth: `calc(min(520px, 62svh) * ${ratio} + 1.75rem)` }}
          >
            <DimensionLine label={formatLength(drawerMm.width, useMm)} className="mr-6.5" />
            <div className="flex gap-2.5">
              <div
                ref={floorRef}
                className="drawer-floor relative min-w-0 flex-1 touch-manipulation select-none rounded-[3px]"
                style={{ aspectRatio: `${drawerSize.width} / ${drawerSize.height}` }}
                onPointerDown={handleFloorPointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={hoverWithMouse(null)}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  data-has-selection={pieceSelected ? "" : undefined}
                >
                  {pieces.map((piece, position) => {
                    const state =
                      piece.key === selectedKey
                        ? "selected"
                        : piece.key === hoverKey
                          ? "hover"
                          : undefined;
                    return (
                      <div key={position} className="piece-slot absolute p-px" style={piece.slotStyle}>
                        <div
                          className={cn("piece", PIECE_TYPE_CLASS[piece.item.type])}
                          data-state={state}
                          style={piece.cellStyle}
                        >
                          {piece.label && bins.length === 0 ? (
                            <span className="piece-label">{piece.label}</span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div
                  role="group"
                  aria-label="Bins in the drawer"
                  className="absolute inset-0"
                  data-has-selection={binGroupSelected ? "" : undefined}
                >
                  {bins.map((bin) => {
                    const moving = draft?.binId === bin.id;
                    const rect = moving ? draft.rect : bin;
                    const issue = issues.get(bin.id);
                    const selected = selectedBinId === bin.id;
                    const highlighted = binGroupSelected && binGroupKey.get(bin.id) === selectedKey;
                    const size = binSizeLabel(bin);
                    return (
                      <div
                        key={bin.id}
                        className="bin-slot absolute"
                        style={{ ...rectStyle(rect), padding: binGap }}
                      >
                        <button
                          type="button"
                          ref={(element) => {
                            binRefs.current[bin.id] = element;
                          }}
                          className={cn(
                            "bin focus-visible:outline-hidden",
                            selected ? "touch-none" : "touch-manipulation"
                          )}
                          data-selected={selected ? "" : undefined}
                          data-highlighted={highlighted ? "" : undefined}
                          data-problem={issue ? "" : undefined}
                          data-dragging={moving ? (draft.valid ? "valid" : "invalid") : undefined}
                          aria-pressed={selected}
                          onPointerDown={(event) => handleBinPointerDown(event, bin)}
                          onKeyDown={(event) => handleBinKeyDown(event, bin)}
                          onClick={() => {
                            setSelectedBinId(bin.id);
                            setSelectedKey(null);
                          }}
                        >
                          <span className="sr-only">
                            {`Bin ${size}, ${bin.height} units tall${bin.label ? `, ${bin.label}` : ""}${issue ? ", needs attention" : ""}`}
                          </span>
                          <span aria-hidden="true" className="bin-label">
                            <span className="bin-size">{size.replace(/ /g, "")}</span>
                            {bin.label ? <span className="bin-name">{bin.label}</span> : null}
                            <span className="bin-height">{bin.height}u</span>
                          </span>
                        </button>
                        {selected && !moving ? (
                          <span
                            aria-hidden="true"
                            className="bin-handle"
                            onPointerDown={(event) => handleResizePointerDown(event, bin)}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {draft && draft.binId === null ? (
                  <div
                    aria-hidden="true"
                    className="bin-slot pointer-events-none absolute"
                    style={{ ...rectStyle(draft.rect), padding: binGap }}
                  >
                    <div className="bin-draft" data-valid={draft.valid ? "" : undefined}>
                      <span className="bin-size">{binSizeLabel(draft.rect).replace(/ /g, "")}</span>
                    </div>
                  </div>
                ) : null}
              </div>
              <DimensionLine label={formatLength(drawerMm.height, useMm)} vertical />
            </div>
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
            <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Legend">
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="bin-swatch size-3" />
                Bin
              </li>
              {presentTypes.map((type) => (
                <li key={type} className="flex items-center gap-1.5">
                  <PieceSwatch type={type} className="size-3" />
                  {LEGEND_LABELS[type]}
                </li>
              ))}
            </ul>
            <span className="pointer-coarse:hidden">
              Drag a bin to move it, or its corner to resize. Arrow keys move the selected bin.
            </span>
            <span className="hidden pointer-coarse:inline">
              Tap a bin to select it, then drag it to move it.
            </span>
          </figcaption>
        </figure>
        {selectedBin ? (
          <BinDetails
            key={selectedBin.id}
            bin={selectedBin}
            issue={issues.get(selectedBin.id)}
            step={binStep(selectedBin, index, baseStep)}
            maxHeight={unitMath.max(maxHeight, selectedBin.height)}
            useMm={useMm}
            canResize={(width, depth) =>
              fits({ x: selectedBin.x, y: selectedBin.y, width, depth }, selectedBin.id)
            }
            onChange={updateBin}
            onDuplicate={() => duplicateBin(selectedBin)}
            onDelete={() => deleteBin(selectedBin.id)}
            onClose={() => {
              setSelectedBinId(null);
              focusBin(selectedBin.id);
            }}
          />
        ) : null}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-semibold tracking-[-0.01em]">Parts to print</h3>
          <span className="text-[13px] text-muted-foreground">
            {numDrawers > 1 ? `Totals for ${numDrawers} drawers` : "Quantity"}
          </span>
        </div>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border">
          {binGroups.map((group) => {
            const selected = selectedKey === group.key;
            const count = group.bins.length;
            const total = unitMath.multiply(count, numDrawers);
            const outer = binOuterSize(group);
            const names = [...new Set(group.bins.map((bin) => bin.label).filter(Boolean))];
            const note = names.length > 0 ? names.join(", ") : null;
            return (
              <li key={group.key}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    toggle(group.key);
                    setSelectedBinId(null);
                  }}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4",
                    selected ? "bg-brand-soft" : "hover:bg-accent/70"
                  )}
                >
                  <span aria-hidden="true" className="bin-swatch size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      <span>Bin</span>{" "}
                      <span className="tabular-nums">
                        {binSizeLabel(group)} · {group.height}u
                      </span>{" "}
                      <span className="sr-only">
                        {`— ${count} in this drawer${note ? ` · ${note}` : ""}${numDrawers > 1 ? `, ${total} in total` : ""}`}
                      </span>
                    </span>{" "}
                    <span
                      className="block truncate text-[13px] text-muted-foreground tabular-nums"
                      title={note ?? undefined}
                    >
                      {formatSize(outer.width, outer.depth, useMm)} ·{" "}
                      {formatLength(outer.height, useMm)} tall
                      {note ? (
                        <span aria-hidden="true" className="text-foreground/80">
                          {" "}
                          · {note}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-right tabular-nums">
                    <span className="block text-sm font-semibold">×{total}</span>
                    {numDrawers > 1 ? (
                      <span className="block text-xs text-muted-foreground">{count} per drawer</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
          {groups.map((group) => {
            const key = previewPieceKey(group.item);
            const details = getPreviewPieceDetails(group.item, layout);
            const selected = selectedKey === key;
            const total = unitMath.multiply(group.count, numDrawers);
            const physical = formatSize(details.widthMm, details.heightMm, useMm);
            return (
              <li
                key={key}
                ref={(element) => {
                  rowRefs.current[key] = element;
                }}
                className="scroll-my-4"
              >
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    toggle(key);
                    setSelectedBinId(null);
                  }}
                  onPointerEnter={hoverWithMouse(key)}
                  onPointerLeave={hoverWithMouse(null)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4",
                    selected
                      ? "bg-brand-soft"
                      : hoverKey === key
                        ? "bg-accent/70"
                        : "hover:bg-accent/70"
                  )}
                >
                  <PieceSwatch type={group.item.type} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      <span>{details.typeLabel}</span>{" "}
                      <span className="tabular-nums">{details.gridLabel}</span>{" "}
                      <span className="sr-only">
                        {`— ${group.count} in this drawer${numDrawers > 1 ? `, ${total} in total` : ""}`}
                      </span>
                    </span>{" "}
                    <span className="block truncate text-[13px] text-muted-foreground tabular-nums">
                      {physical}
                    </span>
                  </span>
                  <span aria-hidden="true" className="shrink-0 text-right tabular-nums">
                    <span className="block text-sm font-semibold">×{total}</span>
                    {numDrawers > 1 ? (
                      <span className="block text-xs text-muted-foreground">
                        {group.count} per drawer
                      </span>
                    ) : null}
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
                      selected && "rotate-180"
                    )}
                  />
                </button>
                {selected ? (
                  <PieceDetails
                    item={group.item}
                    count={group.count}
                    layout={layout}
                    useMm={useMm}
                    onClear={() => clearSelection(key)}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

interface DimensionLineProps {
  label: string;
  vertical?: boolean;
  className?: string;
}

const DimensionLine: React.FC<DimensionLineProps> = ({ label, vertical, className }) => (
  <div
    aria-hidden="true"
    className={cn(
      "flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-muted-foreground tabular-nums",
      vertical ? "w-4 [writing-mode:vertical-rl]" : "mb-2 h-4",
      className
    )}
  >
    <span className={cn("bg-current opacity-40", vertical ? "h-px w-2.5" : "h-2.5 w-px")} />
    <span className={cn("flex-1 bg-current opacity-25", vertical ? "w-px" : "h-px")} />
    <span className="whitespace-nowrap">{label}</span>
    <span className={cn("flex-1 bg-current opacity-25", vertical ? "w-px" : "h-px")} />
    <span className={cn("bg-current opacity-40", vertical ? "h-px w-2.5" : "h-2.5 w-px")} />
  </div>
);

interface PieceDetailsProps {
  item: LayoutItem;
  count: number;
  layout: LayoutItem[];
  useMm: boolean;
  onClear: () => void;
}

const PieceDetails: React.FC<PieceDetailsProps> = ({ item, count, layout, useMm, onClear }) => {
  const details = getPreviewPieceDetails(item, layout);

  return (
    <div className="border-t bg-muted/50 px-3 pb-4 pt-3 duration-200 ease-out animate-in fade-in-0 slide-in-from-top-1 motion-reduce:slide-in-from-top-0 sm:px-4">
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-[13px] font-semibold">Piece details</h4>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          title="Clear selection"
          className="-mr-1 grid size-8 place-items-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:size-11"
        >
          <X className="size-4" />
        </button>
      </div>
      <dl className="mt-1 grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-1.5 text-[13px] tabular-nums">
        <dt className="text-muted-foreground">Type</dt>
        <dd>{details.typeLabel}</dd>
        <dt className="text-muted-foreground">Grid size</dt>
        <dd>{details.gridLabel}</dd>
        <dt className="text-muted-foreground">Physical size</dt>
        <dd>
          {formatSize(details.widthMm, details.heightMm, useMm)} (
          {formatSize(details.widthMm, details.heightMm, !useMm)})
        </dd>
        <dt className="text-muted-foreground">Position</dt>
        <dd>
          {count > 1
            ? `First at column ${details.column}, row ${details.row}`
            : `Column ${details.column}, row ${details.row}`}
        </dd>
        <dt className="text-muted-foreground">Identical pieces</dt>
        <dd>{details.identicalCount} in this drawer</dd>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">
        {item.type === "spacer"
          ? "Spacers fill the gap at the drawer wall."
          : "Baseplates are split to fit your printer. Bins sit on top of them, across the splits."}
      </p>
    </div>
  );
};

export default GridfinityVisualPreview;
