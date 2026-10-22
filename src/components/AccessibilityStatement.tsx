import React from "react";

const AccessibilityStatement: React.FC = () => {
  return (
    <section
      id="accessibility"
      aria-labelledby="accessibility-heading"
      className="mx-auto w-full max-w-[1400px] scroll-mt-24 px-4 py-12"
    >
      <h2 id="accessibility-heading" className="text-2xl font-semibold">
        Accessibility
      </h2>
      <div className="mt-4 max-w-3xl space-y-3 text-sm text-gray-700">
        <p>
          This calculator is built to be usable by everyone, including people
          who navigate by keyboard or use a screen reader. Every control is a
          native button, input, or select with a visible focus indicator, the
          mobile results summary, tour steps, and share confirmations announce
          through live regions, and the guided tour traps focus inside its
          dialog until it is dismissed.
        </p>
        <p>What we check on every change:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            Automated Axe and Pa11y scans run in continuous integration on
            every pull request.
          </li>
          <li>
            Contrast checks on text and controls, plus tap-target minimums of
            44 pixels on touch layouts.
          </li>
          <li>
            The guided tour, label printing, and share flow are exercised
            end-to-end with keyboard-only input before release.
          </li>
        </ul>
        <p>Known limitations:</p>
        <ul className="list-disc space-y-1 pl-6">
          <li>
            The visual preview is a colored grid; its data is duplicated in the
            &quot;Pieces in this drawer&quot; list so nothing is preview-only.
          </li>
          <li>
            The printed label sheet is a visual artifact; screen readers get a
            summary of the label counts instead of every repeated card.
          </li>
        </ul>
        <p>
          Found a barrier? Open an issue at{" "}
          <a
            href="https://github.com/ntindle/gridfinity-space-optimizer/issues"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            ntindle/gridfinity-space-optimizer
          </a>{" "}
          and we will treat it as a bug.
        </p>
      </div>
    </section>
  );
};

export default AccessibilityStatement;
