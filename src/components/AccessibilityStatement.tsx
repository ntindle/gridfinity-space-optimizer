import React from "react";

const AccessibilityStatement: React.FC = () => {
  return (
    <section
      id="accessibility"
      aria-labelledby="accessibility-heading"
      className="scroll-mt-6 border-t border-border/70 [contain-intrinsic-size:auto_560px] [content-visibility:auto]"
    >
      <div className="mx-auto grid w-full max-w-[1320px] gap-6 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,22.5rem)_minmax(0,1fr)] lg:gap-x-8">
        <h2
          id="accessibility-heading"
          className="text-xl font-semibold tracking-[-0.02em]"
        >
          Accessibility
        </h2>
        <div className="max-w-[65ch] space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            This calculator is built to be usable by everyone, including people
            who navigate by keyboard or use a screen reader. Every control is a
            native button, input, or select with a visible focus indicator. The
            mobile results summary, tour steps, and share confirmations announce
            through live regions, and the guided tour traps focus inside its
            dialog until it is dismissed.
          </p>
          <div>
            <h3 className="font-medium text-foreground">
              What we check on every change
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-border">
              <li>
                Automated Axe and Pa11y scans run in continuous integration on
                every pull request.
              </li>
              <li>
                Contrast checks on text and controls, plus tap-target minimums
                of 44 pixels on touch layouts.
              </li>
              <li>
                The guided tour, label printing, and share flow are exercised
                end-to-end with keyboard-only input before release.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-foreground">Known limitations</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 marker:text-border">
              <li>
                The layout drawing is visual only; everything in it is also in
                the &quot;Parts list&quot;, so nothing is drawing-only.
              </li>
              <li>
                The printed label sheet is a visual artifact; screen readers get
                a summary of the label counts instead of every repeated card.
              </li>
            </ul>
          </div>
          <p>
            Found a barrier? Open an issue at{" "}
            <a
              href="https://github.com/ntindle/gridfinity-space-optimizer/issues"
              target="_blank"
              rel="noreferrer"
              className="rounded-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:decoration-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              ntindle/gridfinity-space-optimizer
            </a>{" "}
            and we will treat it as a bug.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AccessibilityStatement;
