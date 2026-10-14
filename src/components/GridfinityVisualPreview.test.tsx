/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import type { LayoutItem } from "@/types";

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

const renderPreview = (useMm = false) =>
  render(
    <GridfinityVisualPreview
      layout={layout}
      drawerSize={{ width: 15, height: 10 }}
      useMm={useMm}
    />
  );

describe("GridfinityVisualPreview piece selection", () => {
  it("shows no details panel until a piece is selected", () => {
    renderPreview();
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Select a piece to see its size/)
    ).toBeInTheDocument();
  });

  it("shows the clicked piece's details, with inches first when useMm is false", () => {
    renderPreview(false);
    fireEvent.click(
      screen.getByRole("button", { name: /Spacer 6x0\.5, select for details/i })
    );

    expect(screen.getByText("Piece details")).toBeInTheDocument();
    // "Spacer" appears twice: once as the cell's label, once as the Type value.
    expect(screen.getAllByText("Spacer")).toHaveLength(2);
    expect(screen.getByText("6 × 0.5")).toBeInTheDocument();
    // 252mm = 9.92″, 21mm = 0.83″
    expect(
      screen.getByText(/9\.92.*×.*0\.83.*\(252 mm × 21 mm\)/)
    ).toBeInTheDocument();
    expect(screen.getByText("Column 0, row 2")).toBeInTheDocument();
    expect(screen.getByText("1 in this drawer")).toBeInTheDocument();
  });

  it("shows millimetres first when useMm is true", () => {
    renderPreview(true);
    // Two identical 3×2 baseplates share one aria-label; either is fine.
    const cells = screen.getAllByRole("button", {
      name: /Baseplate 3x2, select for details/i,
    });
    fireEvent.click(cells[0]);

    // 126mm × 84mm (4.96″ × 3.31″); two identical 3×2 baseplates.
    expect(
      screen.getByText(/126 mm × 84 mm \(4\.96.*× 3\.31.*\)/)
    ).toBeInTheDocument();
    expect(screen.getByText("2 in this drawer")).toBeInTheDocument();
  });

  it("toggles selection off when the selected piece is clicked again", () => {
    renderPreview();
    const cell = screen.getAllByRole("button", {
      name: /Baseplate 3x2, select for details/i,
    })[0];
    fireEvent.click(cell);
    expect(screen.getByText("Piece details")).toBeInTheDocument();
    expect(cell).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(cell);
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
    expect(cell).toHaveAttribute("aria-pressed", "false");
  });

  it("clears the selection via the Clear selection button", () => {
    renderPreview();
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /Baseplate 3x2, select for details/i,
      })[0]
    );
    expect(screen.getByText("Piece details")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Clear selection/i }));
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
  });

  it("clears the selection when the layout changes", () => {
    const { rerender } = renderPreview();
    fireEvent.click(
      screen.getAllByRole("button", {
        name: /Baseplate 3x2, select for details/i,
      })[0]
    );
    expect(screen.getByText("Piece details")).toBeInTheDocument();

    rerender(
      <GridfinityVisualPreview
        layout={[layout[0]]}
        drawerSize={{ width: 15, height: 10 }}
        useMm={false}
      />
    );
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
  });
});
