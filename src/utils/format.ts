import { unitMath } from "@/services/unitMath";
import type { DrawerSize } from "@/types";

const toInches = (mm: number): number => unitMath.convert(mm, "mm", "inch");

const trim = (value: number, decimals: number): string =>
  String(unitMath.round(value, decimals));

export const formatLength = (mm: number, useMm: boolean): string =>
  useMm ? `${trim(mm, 1)} mm` : `${trim(toInches(mm), 2)} in`;

export const formatSize = (
  widthMm: number,
  heightMm: number,
  useMm: boolean
): string =>
  useMm
    ? `${trim(widthMm, 1)} × ${trim(heightMm, 1)} mm`
    : `${trim(toInches(widthMm), 2)} × ${trim(toInches(heightMm), 2)} in`;

export const drawerSizeMm = (drawerSize: DrawerSize) => ({
  width: unitMath.convert(drawerSize.width, "inch", "mm"),
  height: unitMath.convert(drawerSize.height, "inch", "mm"),
});

export const formatDrawerSize = (
  drawerSize: DrawerSize,
  useMm: boolean
): string => {
  const { width, height } = drawerSizeMm(drawerSize);
  return formatSize(width, height, useMm);
};

export const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`
): string => `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;

export const parseDecimal = (value: string): number => {
  const trimmed = value.trim();
  if (trimmed.includes(".") || /^[1-9]\d{0,2}(,\d{3})+$/.test(trimmed)) {
    return Number.parseFloat(trimmed.replace(/,/g, ""));
  }
  return Number.parseFloat(trimmed.replace(",", "."));
};
