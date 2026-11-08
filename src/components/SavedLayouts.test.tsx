import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SavedLayouts from "./SavedLayouts";
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
  testFit: false,
  labelTabs: false,
  dividerCount: 0,
  lids: false,
  magnets: false,
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

  it("deletes a saved layout", async () => {
    const user = userEvent.setup();
    mockStored([storedEntry()]);
    renderSaved();
    await user.click(screen.getByRole("button", { name: "Delete Workshop" }));
    expect(screen.queryByText("Workshop")).not.toBeInTheDocument();
    expect(screen.getByText(/No saved layouts yet/)).toBeInTheDocument();
  });
});
