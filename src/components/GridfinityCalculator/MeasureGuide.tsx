import React from "react";
import { ChevronRight } from "lucide-react";

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
    body: "The in/mm toggle converts for you, so enter the number exactly as the tape reads it instead of converting by hand.",
  },
];

const MeasureGuide: React.FC = () => (
  <details className="group text-sm">
    <summary className="-mx-1 inline-flex min-h-8 cursor-pointer list-none items-center gap-1 rounded-md px-1 font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-11 [&::-webkit-details-marker]:hidden">
      <ChevronRight
        aria-hidden="true"
        className="size-4 transition-transform duration-200 ease-out group-open:rotate-90 motion-reduce:transition-none"
      />
      How to measure your drawer
    </summary>
    <ol className="mt-2 list-decimal space-y-2.5 rounded-lg bg-muted/60 py-3 pl-8 pr-3 text-[13px] leading-relaxed text-muted-foreground marker:font-medium marker:text-foreground">
      {GUIDE_STEPS.map((step) => (
        <li key={step.title} className="pl-1">
          <span className="font-medium text-foreground">{step.title}</span>
          {": "}
          {step.body}
        </li>
      ))}
    </ol>
  </details>
);

export default MeasureGuide;
