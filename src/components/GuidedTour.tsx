import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scrollBehavior } from "@/utils/motion";

interface TourStep {
  id: string;
  title: string;
  body: string;
}

interface GuidedTourProps {
  open: boolean;
  onClose: () => void;
}

interface Spotlight {
  top: number;
  left: number;
  width: number;
  height: number;
}

const STEPS: TourStep[] = [
  {
    id: "drawer",
    title: "Measure your drawer",
    body: "Enter the inside width and depth of your drawer. The guide under the inputs shows how to measure.",
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
    body: "The drawing shows every piece to scale. Select a piece for its details, position, and contents.",
  },
  {
    id: "share",
    title: "Share or print labels",
    body: "Copy a share link for your layout, or scroll to Bin labels to print a label for every bin.",
  },
];

const VIEWPORT_MARGIN = 12;
const ANCHOR_GAP = 12;
const SPOTLIGHT_PADDING = 6;

const GuidedTour: React.FC<GuidedTourProps> = ({ open, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [cardPosition, setCardPosition] = useState({ top: VIEWPORT_MARGIN, left: VIEWPORT_MARGIN });
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
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
    setSpotlight({
      top: anchorRect.top - SPOTLIGHT_PADDING,
      left: anchorRect.left - SPOTLIGHT_PADDING,
      width: anchorRect.width + SPOTLIGHT_PADDING * 2,
      height: anchorRect.height + SPOTLIGHT_PADDING * 2,
    });
    const fitsBelow =
      anchorRect.bottom + ANCHOR_GAP + card.offsetHeight <= window.innerHeight - VIEWPORT_MARGIN;
    const fitsAbove = anchorRect.top - ANCHOR_GAP - card.offsetHeight >= VIEWPORT_MARGIN;
    let top: number;
    if (fitsBelow) {
      top = anchorRect.bottom + ANCHOR_GAP;
    } else if (fitsAbove) {
      top = anchorRect.top - ANCHOR_GAP - card.offsetHeight;
    } else {
      top = window.innerHeight - VIEWPORT_MARGIN - card.offsetHeight;
    }
    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - card.offsetWidth - VIEWPORT_MARGIN);
    const left = Math.min(Math.max(VIEWPORT_MARGIN, anchorRect.left), maxLeft);
    setCardPosition({ top: Math.max(VIEWPORT_MARGIN, top), left });
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
      'button[data-section-toggle][aria-expanded="false"]'
    );
    const reveal = () => {
      if (typeof anchor.scrollIntoView === "function") {
        anchor.scrollIntoView({ block: "center", behavior: scrollBehavior() });
      }
      updateCardPosition();
    };
    if (toggle && window.getComputedStyle(toggle).display !== "none") {
      toggle.click();
      const frame = requestAnimationFrame(reveal);
      return () => cancelAnimationFrame(frame);
    }
    reveal();
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
        className={cn(
          "fixed inset-0 z-40 duration-200 ease-out animate-in fade-in-0",
          !spotlight && "bg-stone-950/45"
        )}
        onClick={onClose}
        aria-hidden="true"
        data-testid="guided-tour-backdrop"
      />
      {spotlight ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-40 rounded-xl shadow-[0_0_0_2px_var(--brand),0_0_0_9999px_rgb(12_10_9/0.45)] duration-200 ease-out animate-in fade-in-0"
          style={spotlight}
        />
      ) : null}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guided-tour-title"
        tabIndex={-1}
        className="fixed z-50 w-80 max-w-[calc(100vw-24px)] rounded-xl bg-popover p-4 text-popover-foreground shadow-pop outline-none duration-200 ease-out animate-in fade-in-0 zoom-in-[0.97] motion-reduce:zoom-in-100"
        style={{ top: cardPosition.top, left: cardPosition.left }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            Step {visiblePosition} of {visibleSteps.length}
          </p>
          <div className="flex gap-1" aria-hidden="true">
            {visibleSteps.map((candidate) => (
              <span
                key={candidate.id}
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color] duration-200 ease-out",
                  candidate.id === step.id ? "w-4 bg-brand" : "w-1.5 bg-border"
                )}
              />
            ))}
          </div>
        </div>
        <div aria-live="polite">
          <h2 id="guided-tour-title" className="mt-2 text-base font-semibold tracking-[-0.01em]">
            {step.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goBack}
            disabled={displayIndex === 0}
            className="min-h-11 md:min-h-8"
          >
            Back
          </Button>
          <Button type="button" size="sm" onClick={goNext} className="min-h-11 md:min-h-8">
            {isLastStep ? "Done" : "Next"}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto min-h-11 rounded-md px-2 text-[13px] text-muted-foreground underline decoration-transparent underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-current focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring md:min-h-8"
          >
            Skip tour
          </button>
        </div>
      </div>
    </>
  );
};

export default GuidedTour;
