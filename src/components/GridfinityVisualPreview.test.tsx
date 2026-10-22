/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
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
    expect(screen.getByText("Parts list")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Spacer 6 × 0\.5 — 1 in this drawer/i })
    ).toBeInTheDocument();
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Select a piece in the drawing or the list/)
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
    expect(screen.getAllByRole("definition")[0]).toHaveTextContent("Spacer");
    expect(
      screen.getByText(/9\.92 × 0\.83 in \(252 × 21 mm\)/)
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
      screen.getByText(/126 × 84 mm \(4\.96 × 3\.31 in\)/)
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

  it("gives the selected row a distinct selected style", () => {
    renderPreview();
    const row = screen.getByRole("button", {
      name: /Baseplate 3 × 2 — 2 in this drawer/i,
    });
    const unselected = screen.getByRole("button", {
      name: /Spacer 6 × 0\.5 — 1 in this drawer/i,
    });
    expect(row.className).not.toContain("bg-brand-soft");

    fireEvent.click(row);
    expect(row).toHaveAttribute("aria-pressed", "true");
    expect(row.className).toContain("bg-brand-soft");
    expect(unselected.className).not.toContain("bg-brand-soft");
  });

  it("hides the pieces section when the layout has no pieces", () => {
    render(
      <GridfinityVisualPreview
        layout={[]}
        drawerSize={{ width: 15, height: 10 }}
        useMm={false}
        binContents={{}}
        onBinContentsChange={() => {}}
      />
    );
    expect(screen.getByText(/No pieces fit yet/)).toBeInTheDocument();
    expect(screen.queryByText("Parts list")).not.toBeInTheDocument();
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
    expect(
      screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i })
    ).toHaveFocus();
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
      screen.getByText(/252 × 21 mm \(9\.92 × 0\.83 in\)/)
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

describe("GridfinityVisualPreview per-bin contents", () => {
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

  const openPerBinSection = () => {
    fireEvent.click(
      screen.getByText("Name each bin individually (2 bins)")
    );
  };

  it("lists one input per bin with its position when a group has several pieces", () => {
    renderWithContents({});
    selectBaseplates();
    openPerBinSection();
    expect(
      screen.getByLabelText("Bin 1 · column 0, row 0")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Bin 2 · column 3, row 0")
    ).toBeInTheDocument();
  });

  it("hides the per-bin section for a group with a single piece", () => {
    renderWithContents({});
    fireEvent.click(
      screen.getByRole("button", { name: /Spacer 6 × 0.5 — 1 in this drawer/i })
    );
    expect(
      screen.queryByText(/Name each bin individually/i)
    ).not.toBeInTheDocument();
  });

  it("shows the effective contents in each per-bin input", () => {
    renderWithContents({
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#1": "M4 screws",
    });
    selectBaseplates();
    openPerBinSection();
    expect(screen.getByLabelText("Bin 1 · column 0, row 0")).toHaveValue(
      "M3 screws"
    );
    expect(screen.getByLabelText("Bin 2 · column 3, row 0")).toHaveValue(
      "M4 screws"
    );
  });

  it("commits a per-bin override on blur without touching the group value", () => {
    const seen: Record<string, string>[] = [];
    renderWithContents({ "baseplate:3x2": "M3 screws" }, (next) =>
      seen.push(next)
    );
    selectBaseplates();
    openPerBinSection();
    const input = screen.getByLabelText("Bin 1 · column 0, row 0");
    fireEvent.change(input, { target: { value: "M4 screws" } });
    expect(seen).toHaveLength(0);
    fireEvent.blur(input);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#0": "M4 screws",
    });
  });

  it("clearing a per-bin input reverts the bin to the group contents", () => {
    const seen: Record<string, string>[] = [];
    renderWithContents(
      { "baseplate:3x2": "M3 screws", "baseplate:3x2#0": "M4 screws" },
      (next) => seen.push(next)
    );
    selectBaseplates();
    openPerBinSection();
    const input = screen.getByLabelText("Bin 1 · column 0, row 0");
    expect(input).toHaveValue("M4 screws");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({ "baseplate:3x2": "M3 screws" });
  });

  it("marks the pieces list row when bins vary", () => {
    renderWithContents({
      "baseplate:3x2": "M3 screws",
      "baseplate:3x2#0": "M4 screws",
    });
    expect(
      screen.getByRole("button", {
        name: /Baseplate 3 × 2 — 2 in this drawer · M3 screws \(varies by bin\)/i,
      })
    ).toBeInTheDocument();
  });

  it("marks the pieces list row when only per-bin contents exist", () => {
    renderWithContents({ "baseplate:3x2#1": "M4 screws" });
    expect(
      screen.getByRole("button", {
        name: /Baseplate 3 × 2 — 2 in this drawer · varies by bin/i,
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

describe("GridfinityVisualPreview drawing", () => {
  it("selects a piece's group when the piece is clicked in the drawing", () => {
    const { container } = renderPreview();
    const slots = container.querySelectorAll(".piece-slot");
    expect(slots).toHaveLength(3);

    fireEvent.click(slots[1]);

    expect(screen.getByText("Piece details")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Baseplate 3 × 2 — 2 in this drawer/i })
    ).toHaveAttribute("aria-pressed", "true");
    const selected = container.querySelectorAll('.piece[data-state="selected"]');
    expect(selected).toHaveLength(2);

    fireEvent.click(slots[0]);
    expect(screen.queryByText("Piece details")).not.toBeInTheDocument();
  });

  it("labels baseplates but not spacers in the drawing", () => {
    const { container } = renderPreview();
    const labels = Array.from(container.querySelectorAll(".piece-label")).map(
      (label) => label.textContent
    );
    expect(labels).toEqual(["3×2", "3×2"]);
  });

  it("annotates the drawer dimensions in the current unit", () => {
    const { container, rerender } = renderPreview(false);
    expect(container.textContent).toContain("15 in");
    expect(container.textContent).toContain("10 in");
    rerender(
      <GridfinityVisualPreview
        layout={layout}
        drawerSize={{ width: 15, height: 10 }}
        useMm={true}
        binContents={{}}
        onBinContentsChange={() => {}}
      />
    );
    expect(container.textContent).toContain("381 mm");
    expect(container.textContent).toContain("254 mm");
  });

  it("shows per-drawer and total quantities for several identical drawers", () => {
    render(
      <GridfinityVisualPreview
        layout={layout}
        drawerSize={{ width: 15, height: 10 }}
        useMm={false}
        numDrawers={3}
        binContents={{}}
        onBinContentsChange={() => {}}
      />
    );
    const row = screen.getByRole("button", {
      name: /^Baseplate 3 × 2 — 2 in this drawer, 6 in total/,
    });
    expect(row).toHaveTextContent("×6");
    expect(row).toHaveTextContent("2 per drawer");
    expect(screen.getByText("Totals for 3 drawers")).toBeInTheDocument();
  });

  it("does not offer contents for spacers, which never get a label", () => {
    renderPreview();
    fireEvent.click(
      screen.getByRole("button", { name: /Spacer 6 × 0\.5 — 1 in this drawer/i })
    );
    expect(screen.getByText("Piece details")).toBeInTheDocument();
    expect(screen.queryByLabelText("Contents")).not.toBeInTheDocument();
    expect(screen.getByText(/don't get a label/)).toBeInTheDocument();
  });

  it("shows the group name again after a per-bin name is cleared", () => {
    const onCommit = vi.fn();
    render(
      <BinContentsInput
        value="Screws"
        pieceCount={1}
        inputId="bin-contents-bin-0"
        label="Bin 1"
        onCommit={onCommit}
      />
    );
    const input = screen.getByLabelText("Bin 1");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith("");
    expect(input).toHaveValue("Screws");
  });
});
