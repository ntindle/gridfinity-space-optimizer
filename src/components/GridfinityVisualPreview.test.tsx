/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import BinContentsInput from "./BinContentsInput";
import type { Bin, LayoutItem, PrinterSize } from "@/types";

const layout: LayoutItem[] = [
  {
    x: 0,
    y: 0,
    width: 3,
    height: 2,
    type: "baseplate",
    pixelX: 0,
    pixelY: 0,
    pixelWidth: 126,
    pixelHeight: 84,
  },
  {
    x: 3,
    y: 0,
    width: 3,
    height: 2,
    type: "baseplate",
    pixelX: 126,
    pixelY: 0,
    pixelWidth: 126,
    pixelHeight: 84,
  },
  {
    x: 0,
    y: 2,
    width: 6,
    height: 0.5,
    type: "spacer",
    pixelX: 0,
    pixelY: 84,
    pixelWidth: 252,
    pixelHeight: 21,
  },
];

const A1: PrinterSize = { x: 256, y: 256, z: 256 };
const DRAWER = { width: 15, height: 10 };

interface HarnessProps {
  initial?: Bin[];
  useMm?: boolean;
  numDrawers?: number;
  printerSize?: PrinterSize;
  pieces?: LayoutItem[];
  onBins?: (bins: Bin[]) => void;
}

const Harness = ({
  initial = [],
  useMm = false,
  numDrawers = 1,
  printerSize = A1,
  pieces = layout,
  onBins,
}: HarnessProps) => {
  const [bins, setBins] = useState<Bin[]>(initial);
  return (
    <GridfinityVisualPreview
      layout={pieces}
      drawerSize={DRAWER}
      useMm={useMm}
      numDrawers={numDrawers}
      bins={bins}
      onBinsChange={(next) => {
        setBins(next);
        if (Array.isArray(next)) onBins?.(next);
      }}
      printerSize={printerSize}
    />
  );
};

const bin = (overrides: Partial<Bin> = {}): Bin => ({
  id: "b1",
  x: 0,
  y: 0,
  width: 42,
  depth: 42,
  height: 3,
  label: "",
  ...overrides,
});

const floorOf = (container: HTMLElement) => {
  const floor = container.querySelector(".drawer-floor") as HTMLElement;
  vi.spyOn(floor, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    x: 0,
    y: 0,
    width: 381,
    height: 254,
    right: 381,
    bottom: 254,
    toJSON: () => ({}),
  });
  return floor;
};

const pointer = (x: number, y: number) => ({
  clientX: x,
  clientY: y,
  pointerId: 1,
  button: 0,
  pointerType: "mouse",
});

const binButtons = () => within(screen.getByRole("group", { name: "Bins in the drawer" })).queryAllByRole("button");

describe("GridfinityVisualPreview parts list", () => {
  it("lists one row per distinct piece and shows no details until one is selected", () => {
    render(<Harness />);
    expect(screen.getByText("Parts to print")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Spacer 6 × 0\.5 — 1 in this drawer/i })).toBeInTheDocument();
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
  });

  it("shows the selected piece's details, with inches first when useMm is false", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Spacer 6 × 0\.5 — 1 in this drawer/i }));

    expect(screen.getByText("Piece details")).toBeInTheDocument();
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("Spacer");
    expect(screen.getByText(/9\.92 × 0\.83 in \(252 × 21 mm\)/)).toBeInTheDocument();
    expect(screen.getByText("Column 0, row 2")).toBeInTheDocument();
    expect(screen.getByText("Spacers fill the gap at the drawer wall.")).toBeInTheDocument();
  });

  it("shows millimetres first when useMm is true, and first position for a group", () => {
    render(<Harness useMm />);
    fireEvent.click(screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i }));

    expect(screen.getByText(/126 × 84 mm \(4\.96 × 3\.31 in\)/)).toBeInTheDocument();
    expect(screen.getByText("2 in this drawer")).toBeInTheDocument();
    expect(screen.getByText("First at column 0, row 0")).toBeInTheDocument();
  });

  it("toggles selection off when the selected row is clicked again", () => {
    render(<Harness />);
    const row = screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i });
    fireEvent.click(row);
    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(row.className).toContain("bg-brand-soft");

    fireEvent.click(row);
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
    expect(row).toHaveAttribute("aria-pressed", "false");
  });

  it("clears the selection via the Clear selection button and returns focus to the row", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i }));
    fireEvent.click(screen.getByRole("button", { name: /Clear selection/i }));
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i })).toHaveFocus();
  });

  it("clears the selection when the layout changes, but not for a unit change", () => {
    const { rerender } = render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: /Spacer 6 × 0\.5 — 1 in this drawer/i }));
    rerender(<Harness useMm />);
    expect(screen.getByText(/252 × 21 mm \(9\.92 × 0\.83 in\)/)).toBeInTheDocument();
    rerender(<Harness useMm pieces={[layout[0]]} />);
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
  });

  it("says so when no pieces fit", () => {
    render(<Harness pieces={[]} />);
    expect(screen.getByText(/No pieces fit yet/)).toBeInTheDocument();
    expect(screen.queryByText("Parts to print")).not.toBeInTheDocument();
  });

  it("shows per-drawer and total quantities for several identical drawers", () => {
    render(<Harness numDrawers={3} />);
    const row = screen.getByRole("button", { name: /^Baseplate 3 × 2 — 2 in this drawer, 6 in total/ });
    expect(row).toHaveTextContent("×6");
    expect(row).toHaveTextContent("2 per drawer");
    expect(screen.getByText("Totals for 3 drawers")).toBeInTheDocument();
  });

  it("annotates the drawer dimensions in the current unit", () => {
    const { container, rerender } = render(<Harness />);
    expect(container.textContent).toContain("15 in");
    rerender(<Harness useMm />);
    expect(container.textContent).toContain("381 mm");
    expect(container.textContent).toContain("254 mm");
  });

  it("lists bins first, counting a turned bin as the same part", () => {
    render(
      <Harness
        numDrawers={2}
        initial={[
          bin({ id: "a", width: 84, label: "Screws" }),
          bin({ id: "b", x: 84, depth: 84 }),
          bin({ id: "c", x: 126 }),
        ]}
      />
    );
    const list = screen.getByText("Parts to print").parentElement?.nextElementSibling as HTMLElement;
    const rows = within(list).getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(rows[0]).toMatch(/^Bin 2 × 1 · 3u/);
    expect(
      screen.getByRole("button", {
        name: "Bin 2 × 1 · 3u — 2 in this drawer · Screws, 4 in total 3.29 × 1.63 in · 0.97 in tall",
      })
    ).toHaveTextContent("×4");
    expect(screen.getByRole("button", { name: /^Bin 1 × 1 · 3u — 1 in this drawer/ })).toBeInTheDocument();
  });
});

describe("GridfinityVisualPreview bin editor", () => {
  it("adds a 1 × 1 bin in the first free cell and opens it", async () => {
    const onBins = vi.fn();
    render(<Harness initial={[bin()]} onBins={onBins} />);

    fireEvent.click(screen.getByRole("button", { name: "Add bin" }));

    const added = onBins.mock.calls[0][0] as Bin[];
    expect(added).toHaveLength(2);
    expect(added[1]).toMatchObject({ x: 42, y: 0, width: 42, depth: 42, height: 3, label: "" });
    expect(screen.getByRole("heading", { name: "Bin 1 × 1 · 3u" })).toBeInTheDocument();
    await waitFor(() => expect(binButtons()[1]).toHaveFocus());
  });

  it("draws a bin across the cells the pointer passes over", () => {
    const { container } = render(<Harness />);
    const floor = floorOf(container);

    fireEvent.pointerDown(floor, pointer(10, 10));
    fireEvent.pointerMove(floor, pointer(60, 10));
    fireEvent.pointerMove(floor, pointer(110, 60));
    expect(container.querySelector(".bin-draft")).toHaveTextContent("3×2");
    fireEvent.pointerUp(floor, pointer(110, 60));

    expect(binButtons()).toHaveLength(1);
    expect(binButtons()[0]).toHaveAccessibleName("Bin 3 × 2, 3 units tall");
    expect(container.querySelector(".bin-draft")).toBeNull();
  });

  it("refuses to draw over another bin or off the grid", () => {
    const { container } = render(<Harness initial={[bin({ x: 42 })]} />);
    const floor = floorOf(container);

    fireEvent.pointerDown(floor, pointer(10, 10));
    fireEvent.pointerMove(floor, pointer(100, 10));
    expect(container.querySelector(".bin-draft")).not.toHaveAttribute("data-valid");
    fireEvent.pointerUp(floor, pointer(100, 10));
    expect(binButtons()).toHaveLength(1);

    fireEvent.pointerDown(floor, pointer(300, 100));
    fireEvent.pointerUp(floor, pointer(300, 100));
    expect(binButtons()).toHaveLength(1);
  });

  it("moves a bin by dragging it to another cell", () => {
    const onBins = vi.fn();
    const { container } = render(<Harness initial={[bin()]} onBins={onBins} />);
    const floor = floorOf(container);

    fireEvent.pointerDown(binButtons()[0], pointer(21, 21));
    fireEvent.pointerMove(floor, pointer(110, 25));
    fireEvent.pointerUp(floor, pointer(110, 25));

    expect(onBins).toHaveBeenLastCalledWith([bin({ x: 84 })]);
  });

  it("selects a bin on click and edits its size, height, and contents", () => {
    render(<Harness initial={[bin()]} />);
    fireEvent.click(binButtons()[0]);
    expect(binButtons()[0]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Wider" }));
    fireEvent.click(screen.getByRole("button", { name: "Taller" }));
    expect(screen.getByRole("heading", { name: "Bin 2 × 1 · 4u" })).toBeInTheDocument();

    const contents = screen.getByLabelText("Contents");
    fireEvent.change(contents, { target: { value: "  Hex keys " } });
    fireEvent.blur(contents);
    expect(binButtons()[0]).toHaveAccessibleName("Bin 2 × 1, 4 units tall, Hex keys");
  });

  it("caps a bin's height at what the printer can print", () => {
    render(<Harness initial={[bin({ height: 6 })]} printerSize={{ x: 256, y: 256, z: 50 }} />);
    fireEvent.click(binButtons()[0]);
    expect(screen.getByRole("button", { name: "Taller" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Lower" })).toBeEnabled();
  });

  it("moves with arrow keys, resizes with Shift, and ignores moves off the grid", () => {
    const onBins = vi.fn();
    render(<Harness initial={[bin()]} onBins={onBins} />);
    const target = binButtons()[0];

    fireEvent.keyDown(target, { key: "ArrowLeft" });
    expect(onBins).not.toHaveBeenCalled();

    fireEvent.keyDown(target, { key: "ArrowRight" });
    expect(onBins).toHaveBeenLastCalledWith([bin({ x: 42 })]);

    fireEvent.keyDown(binButtons()[0], { key: "ArrowDown", shiftKey: true });
    expect(onBins).toHaveBeenLastCalledWith([bin({ x: 42, depth: 84 })]);
  });

  it("deletes the focused bin with the Delete key", () => {
    render(<Harness initial={[bin(), bin({ id: "b2", x: 42 })]} />);
    fireEvent.keyDown(binButtons()[0], { key: "Delete" });
    expect(binButtons()).toHaveLength(1);
  });

  it("fills every empty cell, then undoes and redoes it", () => {
    render(<Harness initial={[bin({ width: 84 })]} />);

    fireEvent.click(screen.getByRole("button", { name: "Fill with 1 × 1" }));
    expect(binButtons()).toHaveLength(11);
    expect(screen.getByRole("button", { name: "Fill with 1 × 1" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(binButtons()).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(binButtons()).toHaveLength(11);

    fireEvent.keyDown(binButtons()[0], { key: "z", ctrlKey: true });
    expect(binButtons()).toHaveLength(1);
  });

  it("fills with copies of the selected bin", () => {
    render(<Harness initial={[bin({ width: 84, height: 5 })]} />);
    fireEvent.click(binButtons()[0]);
    fireEvent.click(screen.getByRole("button", { name: "Fill with 2 × 1" }));
    expect(binButtons().map((button) => button.getAttribute("aria-pressed"))).toHaveLength(6);
    expect(binButtons()[5]).toHaveAccessibleName("Bin 2 × 1, 5 units tall");
  });

  it("clears every bin and can bring them back", () => {
    render(<Harness initial={[bin(), bin({ id: "b2", x: 42 })]} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear all bins" }));
    expect(binButtons()).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(binButtons()).toHaveLength(2);
  });

  it("flags a bin that no longer fits the grid and explains why", () => {
    render(<Harness initial={[bin({ x: 252 })]} />);
    expect(binButtons()[0]).toHaveAccessibleName("Bin 1 × 1, 3 units tall, needs attention");
    fireEvent.click(binButtons()[0]);
    expect(screen.getByText(/no longer sits on whole grid cells/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Bin 1 × 1 · 3u —/ })).not.toBeInTheDocument();
  });

  it("closes the bin details and returns focus to the bin", async () => {
    render(<Harness initial={[bin()]} />);
    fireEvent.click(binButtons()[0]);
    fireEvent.click(screen.getByRole("button", { name: "Done with this bin" }));
    expect(screen.queryByRole("heading", { name: /^Bin 1 × 1/ })).not.toBeInTheDocument();
    await waitFor(() => expect(binButtons()[0]).toHaveFocus());
  });

  it("duplicates a bin into the next free spot", () => {
    render(<Harness initial={[bin({ label: "Nuts" })]} />);
    fireEvent.click(binButtons()[0]);
    fireEvent.click(screen.getByRole("button", { name: "Duplicate" }));
    expect(binButtons()).toHaveLength(2);
    expect(binButtons()[1]).toHaveAccessibleName("Bin 1 × 1, 3 units tall, Nuts");
  });
});

describe("BinContentsInput", () => {
  it("syncs the draft when the committed value changes externally", () => {
    const { rerender } = render(<BinContentsInput value="Screws" onCommit={() => {}} />);
    expect(screen.getByLabelText("Contents")).toHaveValue("Screws");
    rerender(<BinContentsInput value="Nails" onCommit={() => {}} />);
    expect(screen.getByLabelText("Contents")).toHaveValue("Nails");
  });

  it("commits trimmed text on Enter and skips unchanged values", () => {
    const onCommit = vi.fn();
    render(<BinContentsInput value="Screws" onCommit={onCommit} hint="Printed on this bin's label." />);
    const input = screen.getByLabelText("Contents");
    expect(input).toHaveAccessibleDescription("Printed on this bin's label.");

    fireEvent.change(input, { target: { value: "Screws " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue("Screws");

    fireEvent.change(input, { target: { value: " M4 nuts " } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith("M4 nuts");
  });
});
