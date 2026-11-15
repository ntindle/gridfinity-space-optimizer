import React from "react";
import { LayoutGrid, Plus, Redo2, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { BinHistory } from "@/hooks/useBinHistory";

export type PreviewView = "2d" | "3d";

interface BinToolbarProps {
  hasBins: boolean;
  fillLabel: string;
  canAdd: boolean;
  canFill: boolean;
  history: BinHistory;
  onAdd: () => void;
  onFill: () => void;
  onClear: () => void;
  view?: PreviewView;
  onViewChange?: (view: PreviewView) => void;
  showViewToggle?: boolean;
}

const BinToolbar: React.FC<BinToolbarProps> = ({
  hasBins,
  fillLabel,
  canAdd,
  canFill,
  history,
  onAdd,
  onFill,
  onClear,
  view = "2d",
  onViewChange,
  showViewToggle = false,
}) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
    {showViewToggle && onViewChange ? (
      <SegmentedControl
        value={view}
        onValueChange={onViewChange}
        aria-label="Preview view"
        options={[
          { value: "2d", label: "2D" },
          { value: "3d", label: "3D" },
        ]}
      />
    ) : null}
    {view === "2d" ? (
      <p className="mr-auto text-[13px] text-muted-foreground">
        <span className="pointer-coarse:hidden">Drag across the grid to add a bin.</span>
        <span className="hidden pointer-coarse:inline">Tap the grid to add a bin.</span>
      </p>
    ) : null}
    {view === "2d" ? (
      <>
        <div className="flex items-center gap-0.5 sm:order-last">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={history.undo}
            disabled={!history.canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={history.redo}
            disabled={!history.canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClear}
            disabled={!hasBins}
            aria-label="Clear all bins"
            title="Clear all bins"
          >
            <Trash2 />
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto">
          <Button type="button" variant="outline" size="sm" onClick={onAdd} disabled={!canAdd}>
            <Plus />
            Add bin
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onFill} disabled={!canFill}>
            <LayoutGrid />
            {fillLabel}
          </Button>
        </div>
      </>
    ) : null}
  </div>
);

export default BinToolbar;
