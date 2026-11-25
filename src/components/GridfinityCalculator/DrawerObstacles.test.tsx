/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest";
import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DrawerObstacles from "./DrawerObstacles";
import { MAX_OBSTACLES } from "@/utils/obstacles";
import type { Obstacle } from "@/types";

const Harness = ({
  initial = [],
  useMm = true,
}: {
  initial?: Obstacle[];
  useMm?: boolean;
}) => {
  const [obstacles, setObstacles] = useState<Obstacle[]>(initial);
  return (
    <DrawerObstacles
      obstacles={obstacles}
      setObstacles={setObstacles}
      drawerSize={{ width: 15, height: 12 }}
      useMm={useMm}
    />
  );
};

const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("DrawerObstacles", () => {
  it("adds an obstacle in millimetres and lists it", () => {
    render(<Harness />);
    fill(/From left/, "42");
    fill(/From top/, "0");
    fill(/Obstacle width/, "84");
    fill(/Obstacle depth/, "42");
    fireEvent.click(screen.getByRole("button", { name: "Add obstacle" }));
    expect(screen.getByText(/84 × 42 mm/)).toBeTruthy();
    expect(screen.getByText(/42 mm from the left/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete obstacle 1" })).toBeTruthy();
  });

  it("converts inches to millimetres when adding", () => {
    render(<Harness useMm={false} />);
    fill(/From left/, "1");
    fill(/From top/, "0");
    fill(/Obstacle width/, "2");
    fill(/Obstacle depth/, "1");
    fireEvent.click(screen.getByRole("button", { name: "Add obstacle" }));
    expect(screen.getByText(/2 × 1 in/)).toBeTruthy();
    expect(screen.getByText(/1 in from the left/)).toBeTruthy();
  });

  it("rejects an obstacle running past the drawer edge", () => {
    render(<Harness />);
    fill(/From left/, "340");
    fill(/From top/, "0");
    fill(/Obstacle width/, "42");
    fill(/Obstacle depth/, "42");
    fireEvent.click(screen.getByRole("button", { name: "Add obstacle" }));
    expect(screen.getByRole("alert").textContent).toMatch(/right edge/);
    expect(screen.queryByRole("button", { name: /Delete obstacle/ })).toBeNull();
  });

  it("rejects missing numbers", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Add obstacle" }));
    expect(screen.getByRole("alert").textContent).toMatch(/numbers/);
  });

  it("deletes an obstacle", () => {
    render(
      <Harness
        initial={[{ id: "o1", x: 0, y: 0, width: 42, depth: 42 }]}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete obstacle 1" }));
    expect(screen.queryByRole("button", { name: /Delete obstacle/ })).toBeNull();
  });

  it("marks obstacles outside the current drawer as inert", () => {
    render(
      <Harness
        initial={[{ id: "o1", x: 500, y: 0, width: 42, depth: 42 }]}
      />
    );
    expect(screen.getByText(/Outside the current drawer/)).toBeTruthy();
  });

  it("disables adding at the cap", () => {
    const initial = Array.from({ length: MAX_OBSTACLES }, (_, i) => ({
      id: `o${i}`,
      x: i * 42,
      y: 0,
      width: 42,
      depth: 42,
    }));
    render(<Harness initial={initial} />);
    expect(screen.getByRole("button", { name: "Add obstacle" })).toHaveProperty(
      "disabled",
      true
    );
    expect(screen.getByText(/Up to 8 obstacles per drawer/)).toBeTruthy();
  });
});
