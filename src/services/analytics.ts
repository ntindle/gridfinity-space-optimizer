import type { CaptureResult, PostHog, PostHogConfig } from "posthog-js/dist/module.slim";
import { unitMath } from "@/services/unitMath";
import { drawerSizeMm } from "@/utils/format";
import { CUSTOM_PRINTER_LABEL, SHARE_PARAM, parseShareParam } from "@/utils/shareLayout";
import type { GridfinitySettings } from "@/hooks/useGridfinitySettings";
import type { ExportBundle, ExportRequest } from "@/utils/export/exportFiles";
import type { SavedLayoutSnapshot } from "@/utils/savedLayouts";
import type { Bin } from "@/types";

export const POSTHOG_KEY_META = "posthog-key";
export const POSTHOG_HOST_META = "posthog-host";
export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
export const LAYOUT_EDIT_INTERVAL_MS = 2000;
export const MAX_QUEUED_EVENTS = 100;

export type LayoutChange =
  | "drawer_size"
  | "printer"
  | "grid"
  | "drawer_count"
  | "bin_options"
  | "bins";

export type LayoutSource = "saved" | "share_link";

export type LayoutSummary = {
  drawer_width_mm: number;
  drawer_depth_mm: number;
  units: "in" | "mm";
  printer: string;
  drawers: number;
  bins: number;
};

export type DownloadSummary = LayoutSummary & {
  baseplates: number;
  spacers: number;
  parts: number;
  prints: number;
  skipped_bins: number;
  test_fit: boolean;
  label_tabs: boolean;
  dividers: number;
  lids: boolean;
  magnets: boolean;
  screws: boolean;
};

type NoProperties = Record<never, never>;

export type AnalyticsEvents = {
  layout_created: { change: LayoutChange };
  layout_edited: { change: LayoutChange };
  bins_added: { count: number; total: number };
  preview_3d_opened: NoProperties;
  layout_saved: LayoutSummary;
  layout_loaded: LayoutSummary & { source: LayoutSource };
  layout_shared: LayoutSummary;
  files_downloaded: DownloadSummary;
  labels_printed: { labels: number; style: string };
};

export type AnalyticsEvent = keyof AnalyticsEvents;

type EventArgs<E extends AnalyticsEvent> = [keyof AnalyticsEvents[E]] extends [never]
  ? []
  : [AnalyticsEvents[E]];

type LayoutSummarySource = Pick<
  SavedLayoutSnapshot,
  "drawerSize" | "useMm" | "selectedPrinter" | "numDrawers" | "bins"
>;

type Status = "idle" | "off" | "loading" | "on";

interface QueuedEvent {
  event: AnalyticsEvent;
  properties: object;
}

type PrivacySignals = {
  msDoNotTrack?: string;
  globalPrivacyControl?: boolean;
};

let status: Status = "idle";
let client: PostHog | null = null;
const queue: QueuedEvent[] = [];
let userHasInteracted = false;
let layoutCreated = false;
let applyingLoadedLayout = false;
const nextLayoutEditAt = new Map<LayoutChange, number>();

const collecting = (): boolean => status === "loading" || status === "on";

const readMeta = (name: string): string =>
  document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content.trim() ?? "";

const isYesLike = (value: unknown): boolean =>
  value === true || value === 1 || (typeof value === "string" && /^(1|yes|true)$/i.test(value));

const visitorDeclinedTracking = (): boolean => {
  const signals = navigator as Navigator & PrivacySignals;
  const legacyDoNotTrack = (window as Window & { doNotTrack?: string }).doNotTrack;
  return [
    signals.doNotTrack,
    signals.msDoNotTrack,
    legacyDoNotTrack,
    signals.globalPrivacyControl,
  ].some(isYesLike);
};

const isAutomatedBrowser = (): boolean => navigator.webdriver === true;

const withoutSharePayload = (value: unknown): unknown => {
  if (typeof value !== "string" || !value.includes(`${SHARE_PARAM}=`)) return value;
  try {
    const url = new URL(value);
    if (!url.searchParams.has(SHARE_PARAM)) return value;
    url.searchParams.delete(SHARE_PARAM);
    return url.toString();
  } catch {
    return value;
  }
};

const stripSharePayload = (event: CaptureResult): CaptureResult => ({
  ...event,
  properties: Object.fromEntries(
    Object.entries(event.properties ?? {}).map(([key, value]) => [key, withoutSharePayload(value)])
  ),
});

const posthogConfig = (apiHost: string): Partial<PostHogConfig> => ({
  api_host: apiHost,
  cookieless_mode: "always",
  persistence: "memory",
  person_profiles: "never",
  respect_dnt: true,
  capture_pageview: true,
  capture_pageleave: true,
  autocapture: false,
  rageclick: false,
  capture_dead_clicks: false,
  capture_heatmaps: false,
  capture_performance: false,
  disable_session_recording: true,
  disable_surveys: true,
  disable_external_dependency_loading: true,
  advanced_disable_flags: true,
  mask_personal_data_properties: true,
  before_send: stripSharePayload,
});

const send = (event: AnalyticsEvent, properties: object): void => {
  try {
    client?.capture(event, { ...properties });
  } catch {
    status = "off";
  }
};

export function track<E extends AnalyticsEvent>(event: E, ...args: EventArgs<E>): void {
  const properties: object = args[0] ?? {};
  if (status === "loading") {
    if (queue.length < MAX_QUEUED_EVENTS) queue.push({ event, properties });
    return;
  }
  if (status === "on") send(event, properties);
}

const printerLabel = (printer: string): string =>
  printer.toLowerCase() === CUSTOM_PRINTER_LABEL.toLowerCase() ? CUSTOM_PRINTER_LABEL : printer;

export const layoutSummary = (layout: LayoutSummarySource): LayoutSummary => {
  const drawer = drawerSizeMm(layout.drawerSize);
  return {
    drawer_width_mm: unitMath.round(drawer.width, 0),
    drawer_depth_mm: unitMath.round(drawer.height, 0),
    units: layout.useMm ? "mm" : "in",
    printer: printerLabel(layout.selectedPrinter),
    drawers: layout.numDrawers,
    bins: layout.bins.length,
  };
};

export const trackLayoutChange = (change: LayoutChange): void => {
  if (!collecting() || !userHasInteracted || applyingLoadedLayout) return;
  const now = Date.now();
  if (layoutCreated && now < (nextLayoutEditAt.get(change) ?? 0)) return;
  nextLayoutEditAt.set(change, unitMath.add(now, LAYOUT_EDIT_INTERVAL_MS));
  if (layoutCreated) {
    track("layout_edited", { change });
    return;
  }
  layoutCreated = true;
  track("layout_created", { change });
};

export const trackLayoutLoaded = (source: LayoutSource, layout: LayoutSummarySource): void => {
  if (!collecting()) return;
  track("layout_loaded", { ...layoutSummary(layout), source });
  applyingLoadedLayout = true;
  window.setTimeout(() => {
    applyingLoadedLayout = false;
  }, 0);
};

export const trackBinsCommitted = (previous: readonly Bin[], next: readonly Bin[]): void => {
  if (!collecting()) return;
  const existing = new Set(previous.map((bin) => bin.id));
  const added = next.filter((bin) => !existing.has(bin.id)).length;
  if (added > 0) track("bins_added", { count: added, total: next.length });
  trackLayoutChange("bins");
};

export const trackFilesDownloaded = (
  request: ExportRequest,
  bundle: Pick<ExportBundle, "parts" | "prints" | "skippedBins">
): void => {
  const spacers = request.layout.filter((item) => item.type === "spacer").length;
  const baseplates = unitMath.subtract(request.layout.length, spacers);
  track("files_downloaded", {
    ...layoutSummary({ ...request, selectedPrinter: request.printerName }),
    baseplates: unitMath.multiply(baseplates, request.numDrawers),
    spacers: unitMath.multiply(spacers, request.numDrawers),
    parts: bundle.parts,
    prints: bundle.prints,
    skipped_bins: bundle.skippedBins,
    test_fit: Boolean(request.testFit),
    label_tabs: Boolean(request.labelTabs),
    dividers: request.dividerCount ?? 0,
    lids: Boolean(request.lids),
    magnets: Boolean(request.magnets),
    screws: Boolean(request.screws),
  });
};

const trackedSetter =
  <T>(setter: (value: T) => void, current: T, change: LayoutChange) =>
  (value: T): void => {
    if (typeof value === "function" || !Object.is(value, current)) trackLayoutChange(change);
    setter(value);
  };

export const withLayoutTracking = (settings: GridfinitySettings): GridfinitySettings => {
  if (!collecting()) return settings;
  return {
    ...settings,
    setDrawerSize: trackedSetter(settings.setDrawerSize, settings.drawerSize, "drawer_size"),
    setSelectedPrinter: trackedSetter(settings.setSelectedPrinter, settings.selectedPrinter, "printer"),
    setCustomPrinterSize: trackedSetter(
      settings.setCustomPrinterSize,
      settings.customPrinterSize,
      "printer"
    ),
    setUseHalfSize: trackedSetter(settings.setUseHalfSize, settings.useHalfSize, "grid"),
    setPreferHalfSize: trackedSetter(settings.setPreferHalfSize, settings.preferHalfSize, "grid"),
    setPreferUniformBaseplates: trackedSetter(
      settings.setPreferUniformBaseplates,
      settings.preferUniformBaseplates,
      "grid"
    ),
    setNumDrawers: trackedSetter(settings.setNumDrawers, settings.numDrawers, "drawer_count"),
    setLabelTabs: trackedSetter(settings.setLabelTabs, settings.labelTabs, "bin_options"),
    setDividerCount: trackedSetter(settings.setDividerCount, settings.dividerCount, "bin_options"),
    setLids: trackedSetter(settings.setLids, settings.lids, "bin_options"),
    setMagnets: trackedSetter(settings.setMagnets, settings.magnets, "bin_options"),
    setScrews: trackedSetter(settings.setScrews, settings.screws, "bin_options"),
  };
};

const watchForFirstInput = (): void => {
  const markInteracted = () => {
    userHasInteracted = true;
    window.removeEventListener("pointerdown", markInteracted, true);
    window.removeEventListener("keydown", markInteracted, true);
  };
  window.addEventListener("pointerdown", markInteracted, true);
  window.addEventListener("keydown", markInteracted, true);
};

const trackSharedLayoutVisit = (): void => {
  const shared = parseShareParam(window.location.search);
  if (shared) trackLayoutLoaded("share_link", shared);
};

export const initAnalytics = async (): Promise<void> => {
  if (status !== "idle") return;
  const token = readMeta(POSTHOG_KEY_META);
  if (!token || isAutomatedBrowser() || visitorDeclinedTracking()) {
    status = "off";
    return;
  }
  status = "loading";
  watchForFirstInput();
  trackSharedLayoutVisit();
  try {
    const { default: posthog } = await import("posthog-js/dist/module.slim");
    posthog.init(token, posthogConfig(readMeta(POSTHOG_HOST_META) || DEFAULT_POSTHOG_HOST));
    client = posthog;
    status = "on";
    queue.splice(0).forEach(({ event, properties }) => send(event, properties));
  } catch {
    status = "off";
    queue.length = 0;
  }
};
