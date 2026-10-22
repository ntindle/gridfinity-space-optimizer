export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const scrollBehavior = (): ScrollBehavior =>
  prefersReducedMotion() ? "auto" : "smooth";
