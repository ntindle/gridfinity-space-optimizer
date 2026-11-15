/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import { supportsWebGL } from "@/utils/webgl";
import type { ThreeDPreviewProps } from "./ThreeDPreview";
import type { Bin, LayoutItem, PrinterSize } from "@/types";

vi.mock("@/utils/webgl", () => ({ supportsWebGL: vi.fn(() => true) }));

vi.mock("./ThreeDPreview", () => ({
  default: ({ selectedBinId, selectedKey, onSelectBin, onSelectPiece }: ThreeDPreviewProps) => (
    <div data-testid="three-d-preview">
      <span>
        selected bin {selectedBinId ?? "none"} · selected piece {selectedKey ?? "none"}
      </span>
      <button type="button" onClick={() => onSelectBin("b1")}>
        Select bin b1
      </button>
      <button type="button" onClick={() => onSelectPiece("baseplate:3x2")}>
        Select baseplate
      </button>
    </div>
  ),
}));

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

const bin: Bin = { id: "b1", x: 0, y: 0, width: 84, depth: 42, height: 3, label: "Screws" };

const Harness = ({ initial = [bin] }: { initial?: Bin[] }) => {
  const [bins, setBins] = useState<Bin[]>(initial);
  return (
    <GridfinityVisualPreview
      layout={layout}
      drawerSize={DRAWER}
      useMm={false}
      bins={bins}
      onBinsChange={setBins}
      printerSize={A1}
    />
  );
};

describe("GridfinityVisualPreview 3D view", () => {
  beforeEach(() => {
    vi.mocked(supportsWebGL).mockReturnValue(true);
  });

  it("shows the 2D/3D toggle when WebGL is supported", () => {
    render(<Harness />);
    expect(screen.getByRole("group", { name: "Preview view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3D" })).toHaveAttribute("aria-pressed", "false");
  });

  it("switches to the 3D view and back to 2D", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "3D" }));
    await waitFor(() =>
      expect(screen.getByTestId("three-d-preview")).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: "3D" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "Add bin" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "2D" }));
    await waitFor(() =>
      expect(screen.queryByTestId("three-d-preview")).toBeNull()
    );
    expect(screen.getByRole("button", { name: "Add bin" })).toBeInTheDocument();
  });

  it("selecting a bin in 3D opens its details panel", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "3D" }));
    await waitFor(() =>
      expect(screen.getByTestId("three-d-preview")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Select bin b1" }));
    expect(screen.getByTestId("three-d-preview")).toHaveTextContent("selected bin b1");
    expect(screen.getByRole("region", { name: "Bin 2 × 1 · 3u" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Screws")).toBeInTheDocument();
  });

  it("selecting a piece in 3D highlights its parts-list row", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "3D" }));
    await waitFor(() =>
      expect(screen.getByTestId("three-d-preview")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Select baseplate" }));
    expect(screen.getByTestId("three-d-preview")).toHaveTextContent(
      "selected piece baseplate:3x2"
    );
    const row = screen.getByRole("button", { name: /Baseplate 3 × 2/ });
    expect(row).toHaveAttribute("aria-pressed", "true");
  });

  it("hides the toggle when WebGL is not supported", () => {
    vi.mocked(supportsWebGL).mockReturnValue(false);
    render(<Harness />);
    expect(screen.queryByRole("group", { name: "Preview view" })).toBeNull();
    expect(screen.getByRole("button", { name: "Add bin" })).toBeInTheDocument();
  });
});
