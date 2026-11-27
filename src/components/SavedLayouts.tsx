import React, { useId, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CollapsibleCard from "@/components/CollapsibleCard";
import { layoutSummary, track, trackLayoutLoaded } from "@/services/analytics";
import { saveFile } from "@/utils/download";
import { formatDrawerSize, pluralize } from "@/utils/format";
import {
  LAYOUT_FILE_MAX_BYTES,
  layoutFileName,
  parseLayoutFile,
  serializeLayoutFile,
} from "@/utils/layoutFile";
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
  const [importError, setImportError] = useState<string | null>(null);
  const inputId = useId();
  const importId = useId();

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
    track("layout_saved", layoutSummary(snapshot));
    setName("");
    toast.success(`Saved "${entry.name}"`, {
      description: "It stays on this device until you delete it.",
    });
  };

  const handleLoad = (layout: SavedLayout) => {
    trackLayoutLoaded("saved", layout.snapshot);
    onRestore(layout.snapshot);
    toast.success(`Opened "${layout.name}"`, {
      description: "It replaces the current layout.",
    });
  };

  const handleDelete = (layout: SavedLayout) => {
    persist(removeSavedLayout(saved, layout.id));
  };

  const handleExport = () => {
    const trimmed = name.trim();
    const entryName = trimmed === "" ? defaultSavedLayoutName(snapshot) : trimmed;
    saveFile(
      layoutFileName(entryName),
      serializeLayoutFile(snapshot, entryName),
      "application/json"
    );
    toast.success(`Downloaded "${entryName}"`, {
      description: "Import the JSON file later to restore this layout.",
    });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const fail = () => {
      setImportError("That file is not a valid Gridfinity layout JSON file.");
      toast.error("Could not import that file", {
        description: "Choose a layout JSON file downloaded from this site.",
      });
    };
    if (file.size > LAYOUT_FILE_MAX_BYTES) {
      fail();
      return;
    }
    try {
      const text =
        typeof file.text === "function"
          ? await file.text()
          : await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(String(reader.result ?? ""));
              reader.onerror = () => reject(reader.error);
              reader.readAsText(file);
            });
      const parsed = parseLayoutFile(text);
      if (parsed === null) {
        fail();
        return;
      }
      const entry: SavedLayout = {
        id: createSavedLayoutId(),
        name: parsed.name,
        createdAt: new Date().toISOString(),
        snapshot: parsed.snapshot,
      };
      persist(upsertSavedLayout(saved, entry));
      trackLayoutLoaded("import", parsed.snapshot);
      onRestore(parsed.snapshot);
      setImportError(null);
      toast.success(`Imported "${parsed.name}"`, {
        description: "It replaces the current layout and is saved on this device.",
      });
    } catch {
      fail();
    }
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
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Button type="button" variant="outline" onClick={handleExport}>
            Download layout JSON
          </Button>
          <div className="min-w-0">
            <Label htmlFor={importId}>Import layout file</Label>
            <Input
              id={importId}
              type="file"
              accept=".json,application/json"
              className="mt-1.5"
              onChange={handleImport}
            />
          </div>
        </div>
        {importError !== null && (
          <p role="alert" className="mt-2 text-[13px] leading-snug text-destructive">
            {importError}
          </p>
        )}
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
