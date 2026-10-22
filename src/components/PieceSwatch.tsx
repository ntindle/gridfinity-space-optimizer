import React from "react";
import { cn } from "@/lib/utils";
import { PIECE_TYPE_CLASS } from "@/utils/pieceStyles";
import type { LayoutItem } from "@/types";

interface PieceSwatchProps {
  type: LayoutItem["type"];
  className?: string;
}

const PieceSwatch: React.FC<PieceSwatchProps> = ({ type, className }) => (
  <span
    aria-hidden="true"
    className={cn("piece inline-block size-4 shrink-0", PIECE_TYPE_CLASS[type], className)}
    style={{ "--cell-w": "50%", "--cell-h": "50%" } as React.CSSProperties}
  />
);

export default PieceSwatch;
