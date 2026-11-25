import React, { useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unitMath } from "@/services/unitMath";
import { drawerSizeMm, formatLength, formatSize, parseDecimal } from "@/utils/format";
import {
  MAX_OBSTACLES,
  createObstacleId,
  validateObstacle,
  type ObstacleRect,
} from "@/utils/obstacles";
import type { DrawerSize, Obstacle } from "@/types";

interface DrawerObstaclesProps {
  obstacles: Obstacle[];
  setObstacles: React.Dispatch<React.SetStateAction<Obstacle[]>>;
  drawerSize: DrawerSize;
  useMm: boolean;
}

type Field = "x" | "y" | "width" | "depth";

const FIELDS: { field: Field; label: string }[] = [
  { field: "x", label: "From left" },
  { field: "y", label: "From top" },
  { field: "width", label: "Obstacle width" },
  { field: "depth", label: "Obstacle depth" },
];

const DrawerObstacles: React.FC<DrawerObstaclesProps> = ({
  obstacles,
  setObstacles,
  drawerSize,
  useMm,
}) => {
  const [values, setValues] = useState<Record<Field, string>>({
    x: "",
    y: "",
    width: "",
    depth: "",
  });
  const [error, setError] = useState<string | null>(null);
  const baseId = useId();
  const errorId = useId();
  const unit = useMm ? "mm" : "in";
  const unitName = useMm ? "mm" : "inches";
  const drawerMm = drawerSizeMm(drawerSize);
  const atCap = obstacles.length >= MAX_OBSTACLES;

  const toMm = (value: string): number =>
    unitMath.round(
      unitMath.convert(parseDecimal(value), useMm ? "mm" : "inch", "mm"),
      2
    );

  const handleAdd = () => {
    const candidate: ObstacleRect = {
      x: toMm(values.x),
      y: toMm(values.y),
      width: toMm(values.width),
      depth: toMm(values.depth),
    };
    const problem = validateObstacle(candidate, drawerMm, obstacles.length);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setObstacles((prev) => [...prev, { id: createObstacleId(), ...candidate }]);
    setValues({ x: "", y: "", width: "", depth: "" });
  };

  const handleDelete = (id: string) =>
    setObstacles((prev) => prev.filter((obstacle) => obstacle.id !== id));

  const isOutsideDrawer = (obstacle: Obstacle): boolean =>
    obstacle.x >= drawerMm.width || obstacle.y >= drawerMm.height;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium">Drawer obstacles</h3>
        <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
          Block off space taken by hinges, pipes, or drawer hardware. Baseplates,
          spacers, and bins keep out of it.
        </p>
      </div>
      {obstacles.length > 0 ? (
        <ul className="space-y-1.5">
          {obstacles.map((obstacle, index) => (
            <li
              key={obstacle.id}
              className="flex items-center justify-between gap-3 rounded-md border border-input bg-card px-2.5 py-1.5"
            >
              <span className="min-w-0 text-[13px] leading-snug">
                {formatSize(obstacle.width, obstacle.depth, useMm)}
                <span className="text-muted-foreground">
                  {" "}
                  · {formatLength(obstacle.x, useMm)} from the left,{" "}
                  {formatLength(obstacle.y, useMm)} from the top
                </span>
                {isOutsideDrawer(obstacle) ? (
                  <span className="block text-muted-foreground">
                    Outside the current drawer — not blocking anything.
                  </span>
                ) : null}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                aria-label={`Delete obstacle ${index + 1}`}
                onClick={() => handleDelete(obstacle.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ field, label }) => (
          <div key={field} className="min-w-0 space-y-1.5">
            <Label
              htmlFor={`${baseId}-${field}`}
              className="text-[13px] font-medium text-muted-foreground"
            >
              {label} <span className="sr-only">({unitName})</span>
            </Label>
            <div className="relative">
              <Input
                id={`${baseId}-${field}`}
                type="text"
                inputMode="decimal"
                enterKeyHint="done"
                autoComplete="off"
                value={values[field]}
                disabled={atCap}
                onChange={(e) => {
                  setValues((prev) => ({ ...prev, [field]: e.target.value }));
                  if (error) setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                }}
                onFocus={(e) => e.target.select()}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className="pr-10 tabular-nums"
                placeholder="0"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
              >
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {atCap ? (
        <p className="text-[13px] text-muted-foreground">
          Up to {MAX_OBSTACLES} obstacles per drawer. Delete one to add another.
        </p>
      ) : null}
      <Button type="button" variant="outline" size="sm" disabled={atCap} onClick={handleAdd}>
        <Plus />
        Add obstacle
      </Button>
    </div>
  );
};

export default DrawerObstacles;
