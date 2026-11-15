import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ExampleLayouts from "./ExampleLayouts";
import { EXAMPLE_PROJECTS } from "@/lib/exampleProjects";

const renderExamples = (onRestore = vi.fn()) => {
  render(<ExampleLayouts onRestore={onRestore} />);
  return onRestore;
};

describe("ExampleLayouts", () => {
  it("lists every example with its drawer size and bin count", () => {
    renderExamples();
    expect(screen.getByText("4 example drawers")).toBeInTheDocument();
    for (const example of EXAMPLE_PROJECTS) {
      const card = screen.getByText(example.name).closest("li");
      expect(card).not.toBeNull();
      expect(
        within(card as HTMLElement).getByText(
          new RegExp(`${example.snapshot.bins.length} bins`)
        )
      ).toBeInTheDocument();
      expect(
        within(card as HTMLElement).getByText(example.drawerSource)
      ).toBeInTheDocument();
    }
  });

  it("shows one plan preview block per bin", () => {
    renderExamples();
    for (const example of EXAMPLE_PROJECTS) {
      const card = screen.getByText(example.name).closest("li");
      const preview = (card as HTMLElement).querySelector(
        "[aria-hidden='true']"
      ) as HTMLElement;
      expect(preview.children).toHaveLength(example.snapshot.bins.length);
    }
  });

  it("loads an example through onRestore", async () => {
    const user = userEvent.setup();
    const onRestore = renderExamples();
    const example = EXAMPLE_PROJECTS[0];
    await user.click(screen.getByRole("button", { name: `Load ${example.name}` }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onRestore).toHaveBeenCalledWith(example.snapshot);
  });
});
