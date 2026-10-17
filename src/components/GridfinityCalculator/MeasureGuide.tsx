import React from "react";

interface GuideStep {
  title: string;
  body: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "Measure the inside, not the outside",
    body: "The layout fills the drawer interior where the baseplates sit. Measure between the inner walls, ignoring the drawer front and the outer box.",
  },
  {
    title: "Measure at the bottom",
    body: "Drawer walls slope inward, so the usable rectangle is smallest at the base. A number taken at the top can print a grid that does not fit.",
  },
  {
    title: "Subtract what steals space",
    body: "Drawer slides, lips, rails, screw heads, and cable cutouts all eat millimeters. Note the smallest clear rectangle and enter that.",
  },
  {
    title: "Measure twice, enter once",
    body: "Re-check width and depth before you print. A wrong number here prints a wrong grid, and a second pass with the tape takes a minute.",
  },
  {
    title: "Enter in the units you measured",
    body: "The Inches/mm toggle converts for you, so enter the number exactly as the tape reads it instead of converting by hand.",
  },
];

const MeasureGuide: React.FC = () => (
  <details className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
    <summary className="cursor-pointer select-none font-medium text-foreground">
      How to measure your drawer
    </summary>
    <ol className="mt-2 list-decimal space-y-2 pl-5 text-muted-foreground">
      {GUIDE_STEPS.map((step) => (
        <li key={step.title}>
          <span className="font-medium text-foreground">{step.title}</span>
          {": "}
          {step.body}
        </li>
      ))}
    </ol>
  </details>
);

export default MeasureGuide;
