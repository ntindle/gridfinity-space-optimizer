/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import GridfinityVisualPreview from "./GridfinityVisualPreview";
import type { Bin, LayoutItem, PrinterSize } from "@/types";

vi.mock("@/utils/webgl", () => ({ supportsWebGL: vi.fn(() => true) }));

vi.mock("./ThreeDPreview", () => {
  throw new Error("chunk failed");
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
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

describe("GridfinityVisualPreview 3D chunk failure", () => {
  it("stays in 2D and toasts when the 3D chunk fails to load", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "3D" }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("3D preview couldn't load")
    );
    expect(screen.getByRole("button", { name: "3D" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Add bin" })).toBeInTheDocument();
    expect(screen.queryByTestId("three-d-preview")).toBeNull();
  });
});
