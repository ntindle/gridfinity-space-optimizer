import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BinContentsInputProps {
  value: string;
  pieceCount: number;
  onCommit: (value: string) => void;
  inputId?: string;
  label?: string;
}

const BinContentsInput: React.FC<BinContentsInputProps> = ({
  value,
  pieceCount,
  onCommit,
  inputId = "bin-contents-input",
  label = "Contents",
}) => {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  return (
    <div className="mt-3">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) {
            onCommit(draft);
          }
        }}
        placeholder="e.g. M3 screws"
        maxLength={60}
        className="mt-1"
      />
      <p className="mt-1 text-xs text-gray-600">
        {pieceCount > 1
          ? `Applies to all ${pieceCount} identical pieces.`
          : "Applies to this piece."}{" "}
        Shown on the bin labels below.
      </p>
    </div>
  );
};

export default BinContentsInput;
