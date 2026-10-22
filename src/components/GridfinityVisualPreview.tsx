import React, { useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { FULL_GRID_SIZE, HALF_GRID_SIZE } from "@/utils/gridfinityUtils";
import { unitMath } from "@/services/unitMath";
import { cn } from "@/lib/utils";
import { drawerSizeMm, formatLength, formatSize } from "@/utils/format";
import { scrollBehavior } from "@/utils/motion";
import {
  getPreviewPieceDetails,
  groupPreviewPieces,
  previewPieceKey,
} from "@/utils/previewPieceDetails";
import {
  getBinContents,
  getBinContentsForBin,
  hasPerBinContents,
  setBinContentsForBin,
  setBinContentsForItem,
} from "@/utils/binContents";
import BinContentsInput from "./BinContentsInput";
import PieceSwatch from "./PieceSwatch";
import { PIECE_TYPE_CLASS } from "@/utils/pieceStyles";
import type { LayoutItem, DrawerSize } from "@/types";

interface GridfinityVisualPreviewProps {
  layout: LayoutItem[];
  drawerSize: DrawerSize;
  useMm: boolean;
  numDrawers?: number;
  binContents: Record<string, string>;
  onBinContentsChange: (contents: Record<string, string>) => void;
}

const TYPE_ORDER: LayoutItem["type"][] = ["baseplate", "half-size", "spacer"];
const LEGEND_LABELS: Record<LayoutItem["type"], string> = {
  baseplate: "Baseplate",
  "half-size": "Half-size bin",
  spacer: "Spacer",
};

const percent = (part: number, whole: number): string =>
  `${unitMath.multiply(unitMath.divide(part, whole), 100)}%`;

const cellSize = (item: LayoutItem): number =>
  item.type === "half-size" ? HALF_GRID_SIZE : FULL_GRID_SIZE;

const GridfinityVisualPreview: React.FC<GridfinityVisualPreviewProps> = ({
  layout,
  drawerSize,
  useMm,
  numDrawers = 1,
  binContents,
  onBinContentsChange,
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [prevLayout, setPrevLayout] = useState(layout);
  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});

  if (layout !== prevLayout) {
    setPrevLayout(layout);
    setSelectedKey(null);
    setHoverKey(null);
  }

  const groups = useMemo(() => groupPreviewPieces(layout), [layout]);
  const presentTypes = TYPE_ORDER.filter((type) =>
    groups.some((group) => group.item.type === type)
  );
  const drawerMm = useMemo(() => drawerSizeMm(drawerSize), [drawerSize]);

  const pieces = useMemo(() => {
    const labels = new Map(
      groups.map((group) => [
        previewPieceKey(group.item),
        getPreviewPieceDetails(group.item, layout).gridLabel.replace(/ /g, ""),
      ])
    );
    return layout.map((item) => {
      const key = previewPieceKey(item);
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
          "--cell-w": `calc(100% / ${unitMath.divide(item.pixelWidth, cellSize(item))})`,
          "--cell-h": `calc(100% / ${unitMath.divide(item.pixelHeight, cellSize(item))})`,
        } as React.CSSProperties,
      };
    });
  }, [layout, groups, drawerMm]);

  const toggle = (key: string) =>
    setSelectedKey((current) => (current === key ? null : key));

  const clearSelection = (key: string) => {
    setSelectedKey(null);
    rowRefs.current[key]?.querySelector("button")?.focus();
  };

  const selectFromDrawing = (key: string) => {
    const next = selectedKey === key ? null : key;
    setSelectedKey(next);
    if (next) {
      requestAnimationFrame(() =>
        rowRefs.current[next]?.scrollIntoView?.({
          block: "nearest",
          behavior: scrollBehavior(),
        })
      );
    }
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

  return (
    <div className="space-y-6">
      <figure className="space-y-3" data-tour="results">
        <h3 className="sr-only">Layout preview</h3>
        <div
          className="mx-auto w-full"
          style={{ maxWidth: `calc(min(520px, 62svh) * ${ratio} + 1.75rem)` }}
        >
          <DimensionLine label={formatLength(drawerMm.width, useMm)} className="mr-6.5" />
          <div className="flex gap-2.5">
            <div
              aria-hidden="true"
              data-has-selection={selectedKey ? "" : undefined}
              className="drawer-floor relative min-w-0 flex-1 rounded-[3px]"
              style={{ aspectRatio: `${drawerSize.width} / ${drawerSize.height}` }}
              onPointerLeave={hoverWithMouse(null)}
            >
              {pieces.map((piece, index) => {
                const state =
                  piece.key === selectedKey
                    ? "selected"
                    : piece.key === hoverKey
                      ? "hover"
                      : undefined;
                return (
                  <div
                    key={index}
                    className="piece-slot absolute p-px pointer-fine:cursor-pointer"
                    style={piece.slotStyle}
                    onClick={() => selectFromDrawing(piece.key)}
                    onPointerEnter={hoverWithMouse(piece.key)}
                  >
                    <div
                      className={cn("piece", PIECE_TYPE_CLASS[piece.item.type])}
                      data-state={state}
                      style={piece.cellStyle}
                    >
                      {piece.label ? (
                        <span className="piece-label">{piece.label}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <DimensionLine label={formatLength(drawerMm.height, useMm)} vertical />
          </div>
        </div>
        <figcaption className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Legend">
            {presentTypes.map((type) => (
              <li key={type} className="flex items-center gap-1.5">
                <PieceSwatch type={type} className="size-3" />
                {LEGEND_LABELS[type]}
              </li>
            ))}
          </ul>
          <span>Select a piece in the drawing or the list to see its details.</span>
        </figcaption>
      </figure>

      <div>
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-semibold tracking-[-0.01em]">Parts list</h3>
          <span className="text-[13px] text-muted-foreground">
            {numDrawers > 1 ? `Totals for ${numDrawers} drawers` : "Quantity"}
          </span>
        </div>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border">
          {groups.map((group) => {
            const key = previewPieceKey(group.item);
            const details = getPreviewPieceDetails(group.item, layout);
            const selected = selectedKey === key;
            const contents = getBinContents(binContents, group.item);
            const varies = hasPerBinContents(binContents, key, group.count);
            const total = unitMath.multiply(group.count, numDrawers);
            let rowSuffix = "";
            if (contents) {
              rowSuffix = varies
                ? ` · ${contents} (varies by bin)`
                : ` · ${contents}`;
            } else if (varies) {
              rowSuffix = " · varies by bin";
            }
            const physical = formatSize(details.widthMm, details.heightMm, useMm);
            const note = contents
              ? `${contents}${varies ? " (varies by bin)" : ""}`
              : varies
                ? "Varies by bin"
                : null;
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
                  onClick={() => toggle(key)}
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
                        {`— ${group.count} in this drawer${rowSuffix}${numDrawers > 1 ? `, ${total} in total` : ""}`}
                      </span>
                    </span>
                    <span
                      className="block truncate text-[13px] text-muted-foreground tabular-nums"
                      title={note ?? undefined}
                    >
                      {physical}
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
                    selectedKey={key}
                    item={group.item}
                    count={group.count}
                    layout={layout}
                    useMm={useMm}
                    binContents={binContents}
                    onBinContentsChange={onBinContentsChange}
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
  selectedKey: string;
  item: LayoutItem;
  count: number;
  layout: LayoutItem[];
  useMm: boolean;
  binContents: Record<string, string>;
  onBinContentsChange: (contents: Record<string, string>) => void;
  onClear: () => void;
}

const PieceDetails: React.FC<PieceDetailsProps> = ({
  selectedKey,
  item,
  count,
  layout,
  useMm,
  binContents,
  onBinContentsChange,
  onClear,
}) => {
  const details = getPreviewPieceDetails(item, layout);
  const members = layout.filter((candidate) => previewPieceKey(candidate) === selectedKey);

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
      {item.type === "spacer" ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Spacers fill the gap at the drawer wall, so they don&apos;t get a label.
        </p>
      ) : (
        <BinContentsInput
          value={getBinContents(binContents, item)}
          pieceCount={count}
          onCommit={(draft) =>
            onBinContentsChange(setBinContentsForItem(binContents, item, draft))
          }
        />
      )}
      {count > 1 && item.type !== "spacer" && (
        <details className="group mt-3">
          <summary className="-mx-1 inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-md px-1 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
            <ChevronDown
              aria-hidden="true"
              className="size-4 -rotate-90 transition-transform duration-200 ease-out group-open:rotate-0 motion-reduce:transition-none"
            />
            Name each bin individually ({count} bins)
          </summary>
          <div className="mt-1 grid gap-x-4 sm:grid-cols-2">
            {members.map((member, index) => (
              <BinContentsInput
                key={`${selectedKey}#${index}`}
                inputId={`bin-contents-bin-${index}`}
                label={`Bin ${unitMath.add(index, 1)} · column ${unitMath.round(member.x, 2)}, row ${unitMath.round(member.y, 2)}`}
                value={getBinContentsForBin(binContents, selectedKey, index)}
                pieceCount={1}
                compact
                onCommit={(draft) =>
                  onBinContentsChange(
                    setBinContentsForBin(binContents, selectedKey, index, draft)
                  )
                }
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
};

export default GridfinityVisualPreview;
