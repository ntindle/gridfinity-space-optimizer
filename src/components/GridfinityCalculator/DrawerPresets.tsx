import type React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DRAWER_PRESETS, findDrawerPreset } from "@/lib/drawerPresets";
import { formatDrawerSize } from "@/utils/format";
import type { DrawerSize } from "@/types";

interface DrawerPresetsProps {
  drawerSize: DrawerSize;
  setDrawerSize: React.Dispatch<React.SetStateAction<DrawerSize>>;
  useMm: boolean;
}

const DrawerPresets = ({ drawerSize, setDrawerSize, useMm }: DrawerPresetsProps) => {
  const selected = findDrawerPreset(drawerSize);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = DRAWER_PRESETS.find((item) => item.id === event.target.value);
    if (preset) setDrawerSize({ ...preset.size });
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="drawerPreset" className="text-[13px] font-medium text-muted-foreground">
        Drawer preset
      </Label>
      <select
        id="drawerPreset"
        value={selected?.id ?? ""}
        onChange={handleChange}
        className={cn(
          "flex h-9 w-full min-w-0 rounded-md border border-input bg-card px-3 py-1 text-base shadow-xs transition-[border-color,box-shadow] duration-150 ease-out hover:border-foreground/25 focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-3 focus-visible:ring-ring/20 pointer-coarse:h-11 md:pointer-fine:text-sm"
        )}
      >
        <option value="">Custom size</option>
        {DRAWER_PRESETS.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name} — {formatDrawerSize(preset.size, useMm)}
          </option>
        ))}
      </select>
      {selected ? (
        <p className="text-[13px] leading-snug text-muted-foreground">
          Sized for{" "}
          <a
            href={selected.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            {selected.source}
          </a>
        </p>
      ) : null}
    </div>
  );
};

export default DrawerPresets;
