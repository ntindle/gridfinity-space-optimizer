import React from "react";
import { ArrowUpRight } from "lucide-react";
import { unitMath } from "@/services/unitMath";

const STEPS = [
  {
    title: "Measure the inside of the drawer",
    body: "Width and depth at the base, in inches or millimeters. The guide under the inputs covers the usual traps.",
  },
  {
    title: "Pick your printer",
    body: "Baseplates larger than your print bed are split into pieces that fit, including any bed exclusion zones.",
  },
  {
    title: "Print the parts list",
    body: "Baseplates cover the 42 mm grid. Spacers fill the leftover edge so the grid can't slide around.",
  },
  {
    title: "Label your bins",
    body: "Name what goes in each bin and print a sheet of labels in the style your bins use.",
  },
];

const About: React.FC = () => {
  return (
    <section
      aria-labelledby="about-heading"
      className="border-t border-border/70 [contain-intrinsic-size:auto_480px] [content-visibility:auto]"
    >
      <div className="mx-auto grid w-full max-w-[1320px] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] lg:gap-x-8">
        <div className="max-w-[44ch]">
          <h2
            id="about-heading"
            className="text-xl font-semibold tracking-[-0.02em]"
          >
            What is Gridfinity?
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground text-pretty">
            Gridfinity is an open-source, modular storage system designed by
            Zack Freedman. Bins drop into baseplates built on a 42 mm grid, so
            you can rearrange a drawer without reprinting anything.
          </p>
          <a
            href="https://gridfinity.xyz/"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Learn more at gridfinity.xyz
            <ArrowUpRight aria-hidden="true" className="size-3.5" />
          </a>
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.02em]">
            How it works
          </h2>
          <ol className="mt-5 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[13px] font-semibold tabular-nums text-muted-foreground"
                >
                  {unitMath.add(index, 1)}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold tracking-[-0.01em]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};

export default About;
