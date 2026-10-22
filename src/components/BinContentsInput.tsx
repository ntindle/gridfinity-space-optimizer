import React, { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BinContentsInputProps {
  value: string;
  pieceCount: number;
  onCommit: (value: string) => void;
  inputId?: string;
  label?: string;
  compact?: boolean;
}

const BinContentsInput: React.FC<BinContentsInputProps> = ({
  value,
  pieceCount,
  onCommit,
  inputId = "bin-contents-input",
  label = "Contents",
  compact = false,
}) => {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const hintId = useId();

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = () => {
    if (draft !== value) {
      onCommit(draft);
      setDraft(value);
    }
  };

  return (
    <div className={compact ? "mt-2" : "mt-3"}>
      <Label
        htmlFor={inputId}
        className="text-[13px] font-medium text-muted-foreground"
      >
        {label}
      </Label>
      <Input
        id={inputId}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        enterKeyHint="done"
        autoComplete="off"
        placeholder="e.g. M3 screws"
        maxLength={60}
        aria-describedby={compact ? undefined : hintId}
        className="mt-1.5"
      />
      {compact ? null : (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {pieceCount > 1
            ? `Applies to all ${pieceCount} identical pieces.`
            : "Applies to this piece."}{" "}
          Shown on the bin labels below.
        </p>
      )}
    </div>
  );
};

export default BinContentsInput;
