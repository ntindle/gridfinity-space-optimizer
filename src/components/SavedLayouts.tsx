import React, { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CollapsibleCard from "@/components/CollapsibleCard";
import { formatDrawerSize, pluralize } from "@/utils/format";
import {
  SAVED_LAYOUTS_KEY,
  createSavedLayoutId,
  defaultSavedLayoutName,
  parseSavedLayouts,
  removeSavedLayout,
  serializeSavedLayouts,
  upsertSavedLayout,
  type SavedLayout,
  type SavedLayoutSnapshot,
} from "@/utils/savedLayouts";

interface SavedLayoutsProps {
  snapshot: SavedLayoutSnapshot;
  onRestore: (snapshot: SavedLayoutSnapshot) => void;
}

const SavedLayouts: React.FC<SavedLayoutsProps> = ({ snapshot, onRestore }) => {
  const [saved, setSaved] = useState<SavedLayout[]>(() =>
    parseSavedLayouts(window.localStorage.getItem(SAVED_LAYOUTS_KEY))
  );
  const [name, setName] = useState("");
  const inputId = useId();

  const persist = (layouts: SavedLayout[]) => {
    window.localStorage.setItem(SAVED_LAYOUTS_KEY, serializeSavedLayouts(layouts));
    setSaved(layouts);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    const entry: SavedLayout = {
      id: createSavedLayoutId(),
      name: trimmed === "" ? defaultSavedLayoutName(snapshot) : trimmed,
      createdAt: new Date().toISOString(),
      snapshot,
    };
    persist(upsertSavedLayout(saved, entry));
    setName("");
    toast.success(`Saved "${entry.name}"`, {
      description: "It stays on this device until you delete it.",
    });
  };

  const handleLoad = (layout: SavedLayout) => {
    onRestore(layout.snapshot);
    toast.success(`Opened "${layout.name}"`, {
      description: "It replaces the current layout.",
    });
  };

  const handleDelete = (layout: SavedLayout) => {
    persist(removeSavedLayout(saved, layout.id));
  };

  return (
    <CollapsibleCard
      title="Saved layouts"
      summary={saved.length === 0 ? "None saved" : pluralize(saved.length, "saved layout")}
      defaultOpen={false}
      className="border-t"
    >
      <div>
        <Label htmlFor={inputId}>Layout name</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            id={inputId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={defaultSavedLayoutName(snapshot)}
          />
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
      {saved.length === 0 ? (
        <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
          No saved layouts yet. Save the current layout to come back to it later.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {saved.map((layout) => (
            <li key={layout.id} className="flex items-start justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{layout.name}</p>
                <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
                  {formatDrawerSize(layout.snapshot.drawerSize, layout.snapshot.useMm)}
                  {" · "}
                  {pluralize(layout.snapshot.bins.length, "bin")}
                  {" · "}
                  {new Date(layout.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Load ${layout.name}`}
                  onClick={() => handleLoad(layout)}
                >
                  Load
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${layout.name}`}
                  onClick={() => handleDelete(layout)}
                  className="text-destructive hover:text-destructive"
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[13px] leading-snug text-muted-foreground">
        Saved on this device only, not in share links. Loading a layout replaces
        the current one.
      </p>
    </CollapsibleCard>
  );
};

export default SavedLayouts;
