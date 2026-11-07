/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThreeDPreview from "./ThreeDPreview";
import { boxForInstance, buildThreeDBoxes } from "@/utils/threeDLayout";
import type { Bin, LayoutItem } from "@/types";

const invalidateMock = vi.hoisted(() => vi.fn());
const orbitControlsInstances = vi.hoisted(
  () =>
    [] as Array<{
      listeners: Map<string, Array<() => void>>;
      addEventListener: (event: string, fn: () => void) => void;
      removeEventListener: (event: string, fn: () => void) => void;
    }>
);

vi.mock("@react-three/fiber", () => {
  const camera = { position: { set: () => {} } };
  const gl = { domElement: document.createElement("canvas") };
  return {
    Canvas: ({ children }: { children: ReactNode }) => (
      <div data-testid="r3f-canvas">{children}</div>
    ),
    useThree: (
      selector: (state: { camera: unknown; gl: unknown; invalidate: unknown }) => unknown
    ) => selector({ camera, gl, invalidate: invalidateMock }),
  };
});

vi.mock("three-stdlib", () => ({
  OrbitControls: class {
    target = { set: () => {} };
    listeners = new Map<string, Array<() => void>>();
    constructor() {
      orbitControlsInstances.push(this);
    }
    update = () => {};
    dispose = () => {};
    addEventListener(event: string, fn: () => void) {
      const next = this.listeners.get(event) ?? [];
      next.push(fn);
      this.listeners.set(event, next);
    }
    removeEventListener(event: string, fn: () => void) {
      this.listeners.set(
        event,
        (this.listeners.get(event) ?? []).filter((listener) => listener !== fn)
      );
    }
  },
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
    type: "half-size",
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

const bins: Bin[] = [
  { id: "b1", x: 0, y: 0, width: 84, depth: 42, height: 3, label: "Screws" },
];

const drawerMm = { width: 252, height: 105 };

const renderPreview = (overrides: Partial<ComponentProps<typeof ThreeDPreview>> = {}) => {
  const props = {
    layout,
    bins,
    drawerMm,
    binGroupKey: new Map<string, string>(),
    selectedBinId: null,
    selectedKey: null,
    aspectRatio: "252 / 105",
    onSelectBin: vi.fn(),
    onSelectPiece: vi.fn(),
    ...overrides,
  };
  const result = render(<ThreeDPreview {...props} />);
  return { ...result, props };
};

describe("ThreeDPreview", () => {
  beforeEach(() => {
    invalidateMock.mockClear();
    orbitControlsInstances.length = 0;
  });

  it("renders one instanced mesh per piece kind", () => {
    const { container } = renderPreview();
    expect(screen.getByTestId("r3f-canvas")).toBeInTheDocument();
    expect(container.querySelectorAll("instancedmesh")).toHaveLength(4);
  });

  it("renders no bin mesh when there are no bins", () => {
    const { container } = renderPreview({ bins: [] });
    expect(container.querySelectorAll("instancedmesh")).toHaveLength(3);
  });

  it("maps a bin instance to its box", () => {
    const boxes = buildThreeDBoxes(layout, bins, drawerMm);
    const binBoxes = boxes.filter((box) => box.kind === "bin");
    expect(boxForInstance(binBoxes, 0)?.binId).toBe("b1");
    expect(boxForInstance(binBoxes, 1)).toBeNull();
    expect(boxForInstance(binBoxes, undefined)).toBeNull();
  });

  it("maps a plate instance to its box", () => {
    const boxes = buildThreeDBoxes(layout, bins, drawerMm);
    const plateBoxes = boxes.filter((box) => box.kind === "baseplate");
    expect(boxForInstance(plateBoxes, 0)?.key).toBe("baseplate:3x2");
  });

  it("ignores clicks without an instance", () => {
    const { container, props } = renderPreview();
    const meshes = container.querySelectorAll("instancedmesh");
    fireEvent.click(meshes[0]);
    expect(props.onSelectBin).not.toHaveBeenCalled();
    expect(props.onSelectPiece).not.toHaveBeenCalled();
  });

  it("invalidates the demand-rendered canvas when the orbit controls change", () => {
    renderPreview();
    const controls = orbitControlsInstances[orbitControlsInstances.length - 1];
    expect(controls).toBeDefined();
    controls?.listeners.get("change")?.forEach((listener) => listener());
    expect(invalidateMock).toHaveBeenCalled();
  });

  it("offers a reset view button and the orbit hint", async () => {
    const user = userEvent.setup();
    renderPreview();
    expect(screen.getByRole("button", { name: "Reset view" })).toBeInTheDocument();
    expect(screen.getByText(/Drag to orbit/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset view" }));
    expect(screen.getByRole("button", { name: "Reset view" })).toBeInTheDocument();
  });
});
