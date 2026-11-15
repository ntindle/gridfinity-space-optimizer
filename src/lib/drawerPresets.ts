import type { DrawerSize } from "@/types";

export interface DrawerPreset {
  id: string;
  name: string;
  size: DrawerSize;
  source: string;
  sourceUrl: string;
}

const HUSKY_52_URL =
  "https://www.homedepot.ca/product/husky-52-inch-18-drawer-mobile-tool-storage-chest-and-cabinet-set-in-black/1000804523";

export const DRAWER_PRESETS: DrawerPreset[] = [
  {
    id: "ikea-alex",
    name: "IKEA ALEX drawer unit",
    size: { width: 11.5, height: 20.6 },
    source: "IKEA ALEX drawer unit, interior measured",
    sourceUrl: "https://theworkspacehero.com/alex-drawer-dimensions/",
  },
  {
    id: "husky-52-full-length",
    name: "Husky 52-in chest, full-length drawer",
    size: { width: 47.6, height: 15.8 },
    source: "Husky 52-in 18-drawer chest, full-length drawer",
    sourceUrl: HUSKY_52_URL,
  },
  {
    id: "husky-52-right-hand",
    name: "Husky 52-in chest, right-hand drawer",
    size: { width: 13.9, height: 15.7 },
    source: "Husky 52-in 18-drawer chest, right-hand drawer",
    sourceUrl: HUSKY_52_URL,
  },
  {
    id: "husky-52-left-large",
    name: "Husky 52-in chest, left-hand large drawer",
    size: { width: 31.6, height: 15.8 },
    source: "Husky 52-in 18-drawer chest, left-hand large drawer",
    sourceUrl: HUSKY_52_URL,
  },
];

export const drawerPresetById = (id: string): DrawerPreset => {
  const preset = DRAWER_PRESETS.find((item) => item.id === id);
  if (!preset) throw new Error(`Unknown drawer preset: ${id}`);
  return preset;
};

export const findDrawerPreset = (size: DrawerSize): DrawerPreset | undefined =>
  DRAWER_PRESETS.find(
    (preset) => preset.size.width === size.width && preset.size.height === size.height
  );
