import type { LayoutItem } from "@/types";

export const PIECE_TYPE_CLASS: Record<LayoutItem["type"], string> = {
  baseplate: "piece-plate",
  "half-size": "piece-half",
  spacer: "piece-spacer",
};
