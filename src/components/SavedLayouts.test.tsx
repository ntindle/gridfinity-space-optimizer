import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SavedLayouts from "./SavedLayouts";
import { saveFile } from "@/utils/download";
import { LAYOUT_FILE_MAX_BYTES, serializeLayoutFile } from "@/utils/layoutFile";

vi.mock("@/utils/download", () => ({ saveFile: vi.fn() }));
import {
  SAVED_LAYOUTS_KEY,
  serializeSavedLayouts,
  type SavedLayout,
  type SavedLayoutSnapshot,
} from "@/utils/savedLayouts";

const snapshot = (): SavedLayoutSnapshot => ({
  drawerSize: { width: 15, height: 12 },
  selectedPrinter: "Bambu Lab A1",
  useHalfSize: false,
  preferHalfSize: false,
  preferUniformBaseplates: false,
  numDrawers: 1,
  useMm: false,
  customPrinterSize: { x: 256, y: 256, z: 256 },
  bins: [{ id: "b1", x: 0, y: 0, width: 2, depth: 1, height: 3, label: "Screws" }],
  obstacles: [],
  testFit: false,
  labelTabs: false,
  dividerCount: 0,
  lids: false,
  magnets: false,
  screws: false,
  scoop: false,
  vaseMode: false,
  connectors: false,
  stackBins: false,
    spacerless: false,
  estimateSettings: { material: "PLA", priceUsdPerKg: 20, flowMm3PerS: 8 },
});

const storedEntry = (): SavedLayout => ({
  id: "s1",
  name: "Workshop",
  createdAt: "2026-11-03T12:00:00.000Z",
  snapshot: snapshot(),
});

const mockStored = (layouts: SavedLayout[]) => {
  const getItem = localStorage.getItem as unknown as ReturnType<typeof vi.fn>;
  getItem.mockImplementation((key: string) =>
    key === SAVED_LAYOUTS_KEY ? serializeSavedLayouts(layouts) : null
  );
};

const renderSaved = (onRestore = vi.fn()) => {
  render(<SavedLayouts snapshot={snapshot()} onRestore={onRestore} />);
  return onRestore;
};

describe("SavedLayouts", () => {
  it("shows an empty state when nothing is saved", () => {
    renderSaved();
    expect(screen.getByText(/No saved layouts yet/)).toBeInTheDocument();
    expect(screen.getByText("None saved")).toBeInTheDocument();
  });

  it("saves the current layout under the typed name", async () => {
    const user = userEvent.setup();
    renderSaved();
    await user.type(screen.getByLabelText("Layout name"), "Workshop");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Workshop")).toBeInTheDocument();
    expect(screen.getByText(/1 bin/)).toBeInTheDocument();
    const setItem = localStorage.setItem as unknown as ReturnType<typeof vi.fn>;
    const write = setItem.mock.calls.find(([key]) => key === SAVED_LAYOUTS_KEY);
    expect(write).toBeDefined();
    expect(write?.[1]).toContain("Workshop");
  });

  it("saves under the drawer-size name when the name is blank", async () => {
    const user = userEvent.setup();
    renderSaved();
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("15 × 12 in layout")).toBeInTheDocument();
  });

  it("loads a saved layout through onRestore", async () => {
    const user = userEvent.setup();
    mockStored([storedEntry()]);
    const onRestore = renderSaved();
    await user.click(screen.getByRole("button", { name: "Load Workshop" }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith(
      expect.objectContaining({ selectedPrinter: "Bambu Lab A1" })
    );
  });

  it("downloads the current layout as JSON", async () => {
    const user = userEvent.setup();
    renderSaved();
    await user.type(screen.getByLabelText("Layout name"), "Workshop Drawer");
    await user.click(screen.getByRole("button", { name: "Download layout JSON" }));
    expect(saveFile).toHaveBeenCalledTimes(1);
    const [filename, text, type] = vi.mocked(saveFile).mock.calls[0];
    expect(filename).toBe("workshop-drawer.json");
    expect(type).toBe("application/json");
    expect(JSON.parse(text as string)).toMatchObject({
      format: "gridfinitylayout",
      version: 1,
      name: "Workshop Drawer",
    });
  });

  it("imports a layout file, restores it, and saves it to the list", async () => {
    const user = userEvent.setup();
    mockStored([]);
    const onRestore = renderSaved();
    const imported = { ...snapshot(), numDrawers: 2, scoop: true, vaseMode: true };
    const file = new File([serializeLayoutFile(imported, "Imported")], "imported.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText("Import layout file"), file);
    await waitFor(() => expect(onRestore).toHaveBeenCalledTimes(1));
    expect(onRestore).toHaveBeenCalledWith(
      expect.objectContaining({ numDrawers: 2, scoop: true, vaseMode: false })
    );
    expect(screen.getByText("Imported")).toBeInTheDocument();
  });

  it("shows an error and keeps the list when the imported file is invalid", async () => {
    const user = userEvent.setup();
    mockStored([storedEntry()]);
    const onRestore = renderSaved();
    const file = new File(["not json"], "bad.json", { type: "application/json" });
    await user.upload(screen.getByLabelText("Import layout file"), file);
    expect(await screen.findByRole("alert")).toHaveTextContent(/not a valid/);
    expect(onRestore).not.toHaveBeenCalled();
    expect(screen.getByText("Workshop")).toBeInTheDocument();
  });

  it("rejects an oversize import file without restoring", async () => {
    const user = userEvent.setup();
    mockStored([]);
    const onRestore = renderSaved();
    const file = new File(["x".repeat(LAYOUT_FILE_MAX_BYTES + 1)], "big.json", {
      type: "application/json",
    });
    await user.upload(screen.getByLabelText("Import layout file"), file);
    expect(await screen.findByRole("alert")).toHaveTextContent(/not a valid/);
    expect(onRestore).not.toHaveBeenCalled();
    expect(screen.getByText(/No saved layouts yet/)).toBeInTheDocument();
  });

  it("deletes a saved layout", async () => {
    const user = userEvent.setup();
    mockStored([storedEntry()]);
    renderSaved();
    await user.click(screen.getByRole("button", { name: "Delete Workshop" }));
    expect(screen.queryByText("Workshop")).not.toBeInTheDocument();
    expect(screen.getByText(/No saved layouts yet/)).toBeInTheDocument();
  });
});
