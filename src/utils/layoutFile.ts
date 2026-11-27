import { slug } from "@/utils/printParts";
import {
  defaultSavedLayoutName,
  sanitizeSnapshot,
  type SavedLayoutSnapshot,
} from "@/utils/savedLayouts";

export const LAYOUT_FILE_FORMAT = "gridfinitylayout";
export const LAYOUT_FILE_VERSION = 1;
export const LAYOUT_FILE_MAX_BYTES = 1024 * 1024;

export interface ParsedLayoutFile {
  name: string;
  snapshot: SavedLayoutSnapshot;
}

export const serializeLayoutFile = (
  snapshot: SavedLayoutSnapshot,
  name: string
): string =>
  JSON.stringify(
    {
      format: LAYOUT_FILE_FORMAT,
      version: LAYOUT_FILE_VERSION,
      name,
      exportedAt: new Date().toISOString(),
      snapshot,
    },
    null,
    2
  );

export const parseLayoutFile = (text: string): ParsedLayoutFile | null => {
  if (new TextEncoder().encode(text).length > LAYOUT_FILE_MAX_BYTES) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  if (record.format !== LAYOUT_FILE_FORMAT) return null;
  if (record.version !== LAYOUT_FILE_VERSION) return null;
  const snapshot = sanitizeSnapshot(record.snapshot);
  if (snapshot === null) return null;
  const rawName = typeof record.name === "string" ? record.name.trim() : "";
  const name = rawName === "" ? defaultSavedLayoutName(snapshot) : rawName.slice(0, 200);
  return { name, snapshot };
};

export const layoutFileName = (name: string): string => {
  const stem = slug(name).replace(/\./g, "-").replace(/^-+|-+$/g, "");
  return `${stem === "" ? "gridfinity-layout" : stem}.json`;
};
