import React, { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_LABEL_LENGTH } from "@/utils/bins";

interface BinContentsInputProps {
  value: string;
  onCommit: (value: string) => void;
  inputId?: string;
  label?: string;
  hint?: string;
}

const BinContentsInput: React.FC<BinContentsInputProps> = ({
  value,
  onCommit,
  inputId = "bin-contents-input",
  label = "Contents",
  hint,
}) => {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const hintId = useId();

  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  const commit = () => {
    const next = draft.trim();
    if (next !== value) {
      onCommit(next);
    } else if (draft !== value) {
      setDraft(value);
    }
  };

  return (
    <div>
      <Label htmlFor={inputId} className="text-[13px] font-medium text-muted-foreground">
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
        maxLength={MAX_LABEL_LENGTH}
        aria-describedby={hint ? hintId : undefined}
        className="mt-1.5"
      />
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export default BinContentsInput;
