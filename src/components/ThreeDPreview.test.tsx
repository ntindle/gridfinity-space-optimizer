/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ComponentProps, ReactNode } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThreeDPreview from "./ThreeDPreview";
import { boxForInstance, buildThreeDBoxes } from "@/utils/threeDLayout";
import {
  DARK_SCENE_FLOOR_LIGHTNESS,
  liftLightness,
} from "@/utils/threeDColors";
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

const mockColorScheme = (matches: boolean) => {
  const listeners = new Map<string, Array<(event: { matches: boolean }) => void>>();
  const query = {
    matches,
    addEventListener: vi.fn(
      (event: string, fn: (event: { matches: boolean }) => void) => {
        const next = listeners.get(event) ?? [];
        next.push(fn);
        listeners.set(event, next);
      }
    ),
    removeEventListener: vi.fn(
      (event: string, fn: (event: { matches: boolean }) => void) => {
        listeners.set(
          event,
          (listeners.get(event) ?? []).filter((listener) => listener !== fn)
        );
      }
    ),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => query));
  return {
    query,
    fireChange: (next: boolean) => {
      query.matches = next;
      listeners.get("change")?.forEach((listener) => listener({ matches: next }));
    },
  };
};

describe("ThreeDPreview dark mode", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses the light-mode rig when the color scheme is light", () => {
    mockColorScheme(false);
    const { container } = renderPreview();
    expect(container.querySelector("ambientlight")?.getAttribute("intensity")).toBe(
      "0.85"
    );
    expect(container.querySelectorAll("directionallight")).toHaveLength(1);
    expect(container.querySelector("hemispherelight")).toBeNull();
  });

  it("adds fill lights and lifts the floor color when the color scheme is dark", () => {
    mockColorScheme(true);
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      backgroundColor: "oklch(0.155 0.004 50)",
    } as CSSStyleDeclaration);
    const { container } = renderPreview();
    expect(container.querySelector("ambientlight")?.getAttribute("intensity")).toBe("1");
    expect(container.querySelectorAll("directionallight")).toHaveLength(2);
    expect(container.querySelector("hemispherelight")).not.toBeNull();
    const floorColor = container
      .querySelector("mesh > meshlambertmaterial")
      ?.getAttribute("color");
    expect(floorColor).toBe(
      liftLightness("rgb(14, 12, 11)", DARK_SCENE_FLOOR_LIGHTNESS)
    );
  });

  it("follows the color scheme when it changes", () => {
    const scheme = mockColorScheme(false);
    const { container } = renderPreview();
    expect(container.querySelector("hemispherelight")).toBeNull();
    act(() => scheme.fireChange(true));
    expect(container.querySelector("hemispherelight")).not.toBeNull();
    expect(container.querySelectorAll("directionallight")).toHaveLength(2);
  });
});
