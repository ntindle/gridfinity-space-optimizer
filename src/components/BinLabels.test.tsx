/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BinLabels from "./BinLabels";
import type { Bin } from "@/types";

const bins: Bin[] = [
  { id: "a", x: 0, y: 0, width: 84, depth: 42, height: 6, label: "M3 screws" },
  { id: "b", x: 84, y: 0, width: 42, depth: 42, height: 3, label: "" },
  { id: "c", x: 0, y: 42, width: 252, depth: 84, height: 4, label: "Long things" },
];

const stubPrint = () => {
  const printSpy = vi.fn();
  Object.defineProperty(window, "print", {
    value: printSpy,
    writable: true,
    configurable: true,
  });
  return printSpy;
};

afterEach(() => {
  document.body.classList.remove(
    "print-bin-labels",
    "print-bin-labels-paper",
    "print-bin-labels-cullenect",
    "print-bin-labels-pred-slot"
  );
  vi.restoreAllMocks();
});

describe("BinLabels", () => {
  it("prints one label for every placed bin in every drawer", () => {
    render(<BinLabels bins={bins} useMm={true} numDrawers={2} />);
    expect(screen.getByText("Bin labels")).toBeInTheDocument();
    expect(screen.getAllByText("M3 screws")).toHaveLength(2);
    expect(screen.getAllByText("Long things")).toHaveLength(2);
    expect(screen.getAllByText("1 × 1")).toHaveLength(2);
    expect(screen.getByText(/^6 labels, one for every bin/)).toBeInTheDocument();
  });

  it("shows the bin's outside size in the chosen unit", () => {
    const { rerender } = render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    expect(screen.getByText("83.5 × 41.5 mm")).toBeInTheDocument();
    rerender(<BinLabels bins={bins} useMm={false} numDrawers={1} />);
    expect(screen.getByText("3.29 × 1.63 in")).toBeInTheDocument();
  });

  it("asks for bins when there are none, with nothing to print", () => {
    render(<BinLabels bins={[]} useMm={true} numDrawers={1} />);
    expect(screen.getByText("Bin labels")).toBeInTheDocument();
    expect(screen.getByText(/Add bins to the drawer/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /print labels/i })).not.toBeInTheDocument();
  });

  it("hides the on-screen label sheet from screen readers and summarizes it", () => {
    const { container } = render(<BinLabels bins={bins} useMm={true} numDrawers={2} />);
    const sheet = container.querySelector(".bin-label-sheet");
    expect(sheet?.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("6 labels on the print sheet, one per bin.")).toBeInTheDocument();
  });

  it("print button marks the body for label-only printing and cleans up after print", () => {
    const printSpy = stubPrint();
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(printSpy).toHaveBeenCalledTimes(1);
    expect(document.body.classList.contains("print-bin-labels")).toBe(true);
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(true);
    fireEvent(window, new Event("afterprint"));
    expect(document.body.classList.contains("print-bin-labels")).toBe(false);
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(false);
  });

  it("offers three label styles with the paper card selected by default", () => {
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    expect(screen.getByRole("group", { name: /label style/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Paper card/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Cullenect 36.4/ })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /Bin-width slot/ })).toHaveAttribute("aria-pressed", "false");
  });

  it("switching styles changes the print body class", () => {
    stubPrint();
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    fireEvent.click(screen.getByRole("button", { name: /Cullenect 36.4/ }));
    expect(screen.getByRole("button", { name: /Cullenect 36.4/ })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(document.body.classList.contains("print-bin-labels-cullenect")).toBe(true);
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(false);
    fireEvent(window, new Event("afterprint"));
    expect(document.body.classList.contains("print-bin-labels-cullenect")).toBe(false);
  });

  it("makes bin-width labels exactly as wide as each bin", () => {
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    fireEvent.click(screen.getByRole("button", { name: /Bin-width slot/ }));
    const widths = [...document.querySelectorAll(".bin-label-card")].map((card) =>
      (card as HTMLElement).style.getPropertyValue("--label-w")
    );
    expect(widths).toEqual(["83.5mm", "41.5mm", "251.5mm"]);
  });

  it("puts the contents first on cullenect cards and the size under it", () => {
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    fireEvent.click(screen.getByRole("button", { name: /Cullenect 36.4/ }));
    expect(screen.getByText("M3 screws")).toBeInTheDocument();
    expect(screen.getByText("Bin 2 × 1 · 6u")).toBeInTheDocument();
    expect(screen.getByText("1 × 1")).toBeInTheDocument();
    expect(screen.getByText("3u bin")).toBeInTheDocument();
  });

  it("clears a stale style class before marking the body for printing", () => {
    stubPrint();
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    document.body.classList.add("print-bin-labels-cullenect");
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(true);
    expect(document.body.classList.contains("print-bin-labels-cullenect")).toBe(false);
  });

  it("removes the print body classes on unmount", () => {
    stubPrint();
    const { unmount } = render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));
    expect(document.body.classList.contains("print-bin-labels")).toBe(true);
    unmount();
    expect(document.body.classList.contains("print-bin-labels")).toBe(false);
    expect(document.body.classList.contains("print-bin-labels-paper")).toBe(false);
  });
});

describe("BinLabels printing and limits", () => {
  it("prints bin-width labels wider than a portrait page in landscape", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);

    fireEvent.click(screen.getByRole("button", { name: /Bin-width slot/ }));
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));

    expect(print).toHaveBeenCalled();
    expect(document.getElementById("bin-label-landscape")?.textContent).toBe(
      "@page { size: landscape; }"
    );

    window.dispatchEvent(new Event("afterprint"));
    expect(document.getElementById("bin-label-landscape")).toBeNull();
    print.mockRestore();
  });

  it("keeps portrait when every bin-width label fits the page", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    render(<BinLabels bins={bins.slice(0, 2)} useMm={true} numDrawers={1} />);

    fireEvent.click(screen.getByRole("button", { name: /Bin-width slot/ }));
    fireEvent.click(screen.getByRole("button", { name: /print labels/i }));

    expect(print).toHaveBeenCalled();
    expect(document.getElementById("bin-label-landscape")).toBeNull();
    print.mockRestore();
  });

  it("caps the sheet at 2,000 labels and says so", () => {
    const { container } = render(<BinLabels bins={bins} useMm={true} numDrawers={1000} />);
    expect(container.querySelectorAll(".bin-label-card")).toHaveLength(2000);
    expect(screen.getByText(/shows the first 2,000 of 3,000 labels/)).toBeInTheDocument();
    expect(screen.getByText(/^3,000 labels, one for every bin/)).toBeInTheDocument();
  }, 15_000);

  it("remembers the chosen label style", () => {
    render(<BinLabels bins={bins} useMm={true} numDrawers={1} />);
    fireEvent.click(screen.getByRole("button", { name: /Cullenect 36.4/ }));
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "gridfinity_labelStyle",
      JSON.stringify("cullenect")
    );
  });
});
