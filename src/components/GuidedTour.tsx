import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/button";

interface TourStep {
  id: string;
  title: string;
  body: string;
}

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
}

const STEPS: TourStep[] = [
  {
    id: "drawer",
    title: "Measure your drawer",
    body: "Enter the inside width and height of your drawer. The measuring guide beside the inputs shows how to measure.",
  },
  {
    id: "printer",
    title: "Pick your printer",
    body: "Your printer's build volume splits big baseplates into pieces that fit your print bed.",
  },
  {
    id: "bins",
    title: "Tune the bins",
    body: "Half-size bins and baseplate preferences shape the final layout.",
  },
  {
    id: "results",
    title: "Read the layout",
    body: "The preview shows every piece. Select a piece for its details, position, and contents.",
  },
  {
    id: "share",
    title: "Share or print labels",
    body: "Copy a share link for your layout, or scroll to Bin labels to print a label for every bin.",
  },
];

const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 8;
const HIGHLIGHT_COLOR = "#2563eb";

const GuidedTour: React.FC<GuidedTourProps> = ({ open, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [cardPosition, setCardPosition] = useState({ top: VIEWPORT_MARGIN, left: VIEWPORT_MARGIN });
  const [wasOpen, setWasOpen] = useState(open);
  const cardRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const findAnchor = useCallback((id: string): HTMLElement | null => {
    return document.querySelector<HTMLElement>(`[data-tour="${id}"]`);
  }, []);

  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) setStepIndex(0);
  }

  let resolvedIndex = stepIndex;
  if (open) {
    while (resolvedIndex < STEPS.length && !findAnchor(STEPS[resolvedIndex].id)) {
      resolvedIndex += 1;
    }
    if (resolvedIndex < STEPS.length && resolvedIndex !== stepIndex) {
      setStepIndex(resolvedIndex);
    }
  }
  const displayIndex = Math.min(resolvedIndex, STEPS.length - 1);
  const step = STEPS[displayIndex];
  const isLastStep = displayIndex === STEPS.length - 1;
  const visibleSteps = STEPS.filter((candidate) => findAnchor(candidate.id));
  const visiblePosition = Math.max(
    1,
    visibleSteps.findIndex((candidate) => candidate.id === step.id) + 1
  );

  const updateCardPosition = useCallback(() => {
    const anchor = findAnchor(STEPS[displayIndex].id);
    const card = cardRef.current;
    if (!anchor || !card) return;
    const anchorRect = anchor.getBoundingClientRect();
    const fitsBelow =
      anchorRect.bottom + ANCHOR_GAP + card.offsetHeight <= window.innerHeight - VIEWPORT_MARGIN;
    const top = fitsBelow
      ? anchorRect.bottom + ANCHOR_GAP
      : Math.max(VIEWPORT_MARGIN, anchorRect.top - ANCHOR_GAP - card.offsetHeight);
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - card.offsetWidth - VIEWPORT_MARGIN);
    const left = Math.min(Math.max(VIEWPORT_MARGIN, anchorRect.left), maxLeft);
    setCardPosition({ top, left });
  }, [findAnchor, displayIndex]);

  const goBack = () => {
    let previous = displayIndex - 1;
    while (previous > 0 && !findAnchor(STEPS[previous].id)) {
      previous -= 1;
    }
    setStepIndex(Math.max(0, previous));
  };

  const goNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setStepIndex(displayIndex + 1);
    }
  };

  useEffect(() => {
    if (open && resolvedIndex >= STEPS.length) {
      onClose();
    }
  }, [open, resolvedIndex, onClose]);

  useLayoutEffect(() => {
    if (!open) return;
    const anchor = findAnchor(STEPS[displayIndex].id);
    if (!anchor) return;
    const section = anchor.closest("section[data-tour]");
    const toggle = section?.querySelector<HTMLButtonElement>(
      'button[aria-expanded="false"]'
    );
    if (toggle && window.getComputedStyle(toggle).display !== "none") {
      flushSync(() => {
        toggle.click();
      });
    }
    if (typeof anchor.scrollIntoView === "function") {
      anchor.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
    const previousOutline = anchor.style.outline;
    const previousOutlineOffset = anchor.style.outlineOffset;
    anchor.style.outline = `3px solid ${HIGHLIGHT_COLOR}`;
    anchor.style.outlineOffset = "4px";
    updateCardPosition();
    return () => {
      anchor.style.outline = previousOutline;
      anchor.style.outlineOffset = previousOutlineOffset;
    };
  }, [open, displayIndex, findAnchor, updateCardPosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updateCardPosition, true);
    window.addEventListener("resize", updateCardPosition);
    return () => {
      window.removeEventListener("scroll", updateCardPosition, true);
      window.removeEventListener("resize", updateCardPosition);
    };
  }, [open, updateCardPosition]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      cardRef.current?.focus({ preventScroll: true });
    } else {
      const previous = previousFocusRef.current;
      previousFocusRef.current = null;
      previous?.focus({ preventScroll: true });
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const card = cardRef.current;
      if (!card) return;
      const focusable = Array.from(
        card.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === first || active === card || !card.contains(active))
      ) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && active === last) {
        first.focus();
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
        data-testid="guided-tour-backdrop"
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        tabIndex={-1}
        className="fixed z-50 w-80 max-w-[calc(100vw-24px)] rounded-lg border border-border bg-card p-4 shadow-xl outline-none"
        style={{ top: cardPosition.top, left: cardPosition.left }}
      >
        <p className="text-xs font-medium text-muted-foreground">
          Step {visiblePosition} of {visibleSteps.length}
        </p>
        <div aria-live="polite">
          <h2 id="guided-tour-title" className="mt-1 text-lg font-semibold">
            {step.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={displayIndex === 0}
            className="min-h-[44px]"
          >
            Back
          </Button>
          <Button type="button" onClick={goNext} className="min-h-[44px]">
            {isLastStep ? "Done" : "Next"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto min-h-[44px] px-3 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
