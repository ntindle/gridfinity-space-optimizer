/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import BinContentsInput from "./BinContentsInput";
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
      binContents={{}}
      onBinContentsChange={() => {}}
    />
  );

describe("GridfinityVisualPreview piece selection", () => {
  it("lists one row per distinct piece and shows no details until one is selected", () => {
    renderPreview();
    expect(screen.getByText("Pieces in this drawer")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Spacer 6 × 0\.5 — 1 in this drawer/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Select a piece below to see its size/)
    ).toBeInTheDocument();
  });

  it("shows the selected piece's details, with inches first when useMm is false", () => {
    renderPreview(false);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Spacer 6 × 0\.5 — 1 in this drawer/i,
      })
    );

    expect(screen.getByText("Piece details")).toBeInTheDocument();
    expect(screen.getAllByText("Spacer")).toHaveLength(2);
    expect(
      screen.getByText(/9\.92.*×.*0\.83.*\(252 mm × 21 mm\)/)
    ).toBeInTheDocument();
    expect(screen.getByText("Column 0, row 2")).toBeInTheDocument();
    expect(screen.getByText("1 in this drawer")).toBeInTheDocument();
  });

  it("shows millimetres first when useMm is true, and first position for a group", () => {
    renderPreview(true);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Baseplate 3 × 2 — 2 in this drawer/i,
      })
    );

    expect(
      screen.getByText(/126 mm × 84 mm \(4\.96.*× 3\.31.*\)/)
    ).toBeInTheDocument();
    expect(screen.getByText("2 in this drawer")).toBeInTheDocument();
    expect(
      screen.getByText("First at column 0, row 0")
    ).toBeInTheDocument();
  });

  it("toggles selection off when the selected row is clicked again", () => {
    renderPreview();
    const row = screen.getByRole("button", {
      name: /Baseplate 3 × 2 — 2 in this drawer/i,
    });
    fireEvent.click(row);
    expect(screen.getByText("Piece details")).toBeInTheDocument();
    expect(row).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(row);
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
    expect(row).toHaveAttribute("aria-pressed", "false");
  });

  it("clears the selection via the Clear selection button", () => {
    renderPreview();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Baseplate 3 × 2 — 2 in this drawer/i,
      })
    );
    expect(screen.getByText("Piece details")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Clear selection/i }));
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
  });

  it("clears the selection when the layout changes", () => {
    const { rerender } = renderPreview();
    fireEvent.click(
      screen.getByRole("button", {
        name: /Baseplate 3 × 2 — 2 in this drawer/i,
      })
    );
    expect(screen.getByText("Piece details")).toBeInTheDocument();

    rerender(
      <GridfinityVisualPreview
        layout={[layout[0]]}
        drawerSize={{ width: 15, height: 10 }}
        useMm={false}
        binContents={{}}
        onBinContentsChange={() => {}}
      />
    );
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
  });

  it("keeps the selection when only the unit toggle changes", () => {
    const { rerender } = renderPreview(false);
    fireEvent.click(
      screen.getByRole("button", {
        name: /Spacer 6 × 0\.5 — 1 in this drawer/i,
      })
    );
    expect(screen.getByText("Piece details")).toBeInTheDocument();

    rerender(
      <GridfinityVisualPreview
        layout={layout}
        drawerSize={{ width: 15, height: 10 }}
        useMm={true}
        binContents={{}}
        onBinContentsChange={() => {}}
      />
    );
    expect(screen.getByText("Piece details")).toBeInTheDocument();
    expect(
      screen.getByText(/252 mm × 21 mm \(9\.92.*× 0\.83.*\)/)
    ).toBeInTheDocument();
  });
});

describe("GridfinityVisualPreview bin contents", () => {
  const renderWithContents = (
    binContents: Record<string, string>,
    onBinContentsChange: (contents: Record<string, string>) => void = () => {}
  ) =>
    render(
      <GridfinityVisualPreview
        layout={layout}
        drawerSize={{ width: 15, height: 10 }}
        useMm={false}
        binContents={binContents}
        onBinContentsChange={onBinContentsChange}
      />
    );

  const selectBaseplates = () => {
    fireEvent.click(
      screen.getByRole("button", {
        name: /Baseplate 3 × 2 — 2 in this drawer/i,
      })
    );
  };

  it("shows a contents input in the details panel for the selected group", () => {
    renderWithContents({});
    selectBaseplates();
    const input = screen.getByLabelText("Contents");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "e.g. M3 screws");
    expect(input).toHaveValue("");
  });

  it("commits the edited contents keyed by group on blur", () => {
    const seen: Record<string, string>[] = [];
    renderWithContents({}, (next) => seen.push(next));
    selectBaseplates();
    const input = screen.getByLabelText("Contents");
    fireEvent.change(input, { target: { value: "M3 screws" } });
    expect(seen).toHaveLength(0);
    fireEvent.blur(input);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ "baseplate:3x2": "M3 screws" });
  });

  it("keeps spaces while typing multi-word contents", () => {
    const seen: Record<string, string>[] = [];
    renderWithContents({}, (next) => seen.push(next));
    selectBaseplates();
    const input = screen.getByLabelText("Contents") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "M3 " } });
    fireEvent.change(input, { target: { value: "M3 screws" } });
    expect(input.value).toBe("M3 screws");
    fireEvent.blur(input);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ "baseplate:3x2": "M3 screws" });
  });

  it("does not commit when the draft is unchanged on blur", () => {
    const seen: Record<string, string>[] = [];
    renderWithContents({ "baseplate:3x2": "M3 screws" }, (next) =>
      seen.push(next)
    );
    selectBaseplates();
    fireEvent.blur(screen.getByLabelText("Contents"));
    expect(seen).toHaveLength(0);
  });

  it("removes the group key when the input is cleared", () => {
    const seen: Record<string, string>[] = [];
    renderWithContents({ "baseplate:3x2": "M3 screws" }, (next) =>
      seen.push(next)
    );
    selectBaseplates();
    expect(screen.getByLabelText("Contents")).toHaveValue("M3 screws");
    const input = screen.getByLabelText("Contents");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({});
  });

  it("shows the contents in the pieces list row", () => {
    renderWithContents({ "baseplate:3x2": "M3 screws" });
    expect(
      screen.getByRole("button", {
        name: /Baseplate 3 × 2 — 2 in this drawer · M3 screws/i,
      })
    ).toBeInTheDocument();
  });
});

describe("BinContentsInput", () => {
  it("syncs the draft when the committed value changes externally", () => {
    const { rerender } = render(
      <BinContentsInput value="" pieceCount={2} onCommit={() => {}} />
    );
    const input = screen.getByLabelText("Contents") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "draft text" } });
    expect(input.value).toBe("draft text");
    rerender(
      <BinContentsInput value="external" pieceCount={2} onCommit={() => {}} />
    );
    expect(input.value).toBe("external");
  });

  it("describes how many pieces the contents apply to", () => {
    const { rerender } = render(
      <BinContentsInput value="" pieceCount={3} onCommit={() => {}} />
    );
    expect(
      screen.getByText(/Applies to all 3 identical pieces\./)
    ).toBeInTheDocument();
    rerender(<BinContentsInput value="" pieceCount={1} onCommit={() => {}} />);
    expect(screen.getByText(/Applies to this piece\./)).toBeInTheDocument();
  });
});
