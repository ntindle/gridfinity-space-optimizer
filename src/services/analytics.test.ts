import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { CaptureResult, PostHogConfig } from "posthog-js/dist/module.slim";
import { buildShareUrl } from "@/utils/shareLayout";
import { useGridfinitySettings, type GridfinitySettings } from "@/hooks/useGridfinitySettings";
import type { SavedLayoutSnapshot } from "@/utils/savedLayouts";
import type { Bin, DrawerSize, LayoutItem } from "@/types";

const posthog = vi.hoisted(() => ({ loads: vi.fn(), init: vi.fn(), capture: vi.fn() }));

vi.mock("posthog-js/dist/module.slim", () => {
  posthog.loads();
  return { default: { init: posthog.init, capture: posthog.capture } };
});

const TOKEN = "phc_test";
const restorers: Array<() => void> = [];

const loadAnalytics = async () => {
  vi.resetModules();
  return import("./analytics");
};

const setMeta = (name: string, content: string) => {
  const meta = document.createElement("meta");
  meta.name = name;
  meta.content = content;
  document.head.append(meta);
};

const stubProperty = (target: object, property: string, value: unknown) => {
  Object.defineProperty(target, property, { value, configurable: true });
  restorers.push(() => {
    delete (target as Record<string, unknown>)[property];
  });
};

const startAnalytics = async () => {
  setMeta("posthog-key", TOKEN);
  const analytics = await loadAnalytics();
  await analytics.initAnalytics();
  return analytics;
};

const visitorUsesThePage = () => window.dispatchEvent(new Event("pointerdown"));

const captured = () => posthog.capture.mock.calls.map(([event, properties]) => [event, properties]);

const eventNames = () => posthog.capture.mock.calls.map(([event]) => event);

const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));

const bin = (id: string, label = ""): Bin => ({
  id,
  x: 0,
  y: 0,
  width: 42,
  depth: 42,
  height: 3,
  label,
});

const snapshot = (): SavedLayoutSnapshot => ({
  drawerSize: { width: 15, height: 12 },
  selectedPrinter: "Bambu Lab A1",
  useHalfSize: false,
  preferHalfSize: false,
  preferUniformBaseplates: false,
  numDrawers: 1,
  useMm: false,
  customPrinterSize: { x: 256, y: 256, z: 256 },
  bins: [bin("b1", "Screws")],
  testFit: false,
  labelTabs: false,
  dividerCount: 0,
  lids: false,
  magnets: false,
  screws: false,
  scoop: false,
  estimateSettings: { material: "PLA", priceUsdPerKg: 20, flowMm3PerS: 8 },
});

const piece = (type: LayoutItem["type"]) => ({ type }) as LayoutItem;

beforeEach(() => {
  document.head.innerHTML = "";
  posthog.loads.mockReset();
  posthog.init.mockReset();
  posthog.capture.mockReset();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  restorers.splice(0).forEach((restore) => restore());
  vi.restoreAllMocks();
});

describe("analytics setup", () => {
  it("stays off and never loads PostHog without a project token", async () => {
    const analytics = await loadAnalytics();
    await analytics.initAnalytics();
    analytics.track("preview_3d_opened");

    expect(posthog.loads).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it.each([
    ["Do Not Track is on", () => stubProperty(navigator, "doNotTrack", "1")],
    ["the legacy window.doNotTrack is on", () => stubProperty(window, "doNotTrack", "1")],
    ["msDoNotTrack is on", () => stubProperty(navigator, "msDoNotTrack", "1")],
    ["Global Privacy Control is on", () => stubProperty(navigator, "globalPrivacyControl", true)],
    ["the browser is automated", () => stubProperty(navigator, "webdriver", true)],
  ])("never loads PostHog when %s", async (_, stub) => {
    stub();
    const analytics = await startAnalytics();
    analytics.track("preview_3d_opened");

    expect(posthog.loads).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("starts PostHog in cookieless mode with only pageviews and named events", async () => {
    await startAnalytics();

    expect(posthog.init).toHaveBeenCalledTimes(1);
    const [token, config] = posthog.init.mock.calls[0];
    expect(token).toBe(TOKEN);
    expect(config).toMatchObject({
      api_host: "https://us.i.posthog.com",
      cookieless_mode: "always",
      persistence: "memory",
      person_profiles: "never",
      respect_dnt: true,
      capture_pageview: true,
      autocapture: false,
      capture_heatmaps: false,
      capture_performance: false,
      disable_session_recording: true,
      disable_surveys: true,
      disable_external_dependency_loading: true,
      advanced_disable_flags: true,
    });
  });

  it("sends events to the host named in the posthog-host meta tag", async () => {
    setMeta("posthog-host", "https://eu.i.posthog.com");
    await startAnalytics();

    expect(posthog.init.mock.calls[0][1]).toMatchObject({ api_host: "https://eu.i.posthog.com" });
  });

  it("sends events tracked while PostHog is still loading once it starts", async () => {
    setMeta("posthog-key", TOKEN);
    const analytics = await loadAnalytics();
    const ready = analytics.initAnalytics();
    analytics.track("labels_printed", { labels: 4, style: "paper" });

    expect(posthog.capture).not.toHaveBeenCalled();
    await ready;
    expect(captured()).toEqual([["labels_printed", { labels: 4, style: "paper" }]]);
  });

  it("keeps at most 100 events while PostHog is loading", async () => {
    setMeta("posthog-key", TOKEN);
    const analytics = await loadAnalytics();
    const ready = analytics.initAnalytics();
    Array.from({ length: 150 }).forEach(() => analytics.track("preview_3d_opened"));
    await ready;

    expect(posthog.capture).toHaveBeenCalledTimes(100);
  });

  it("turns itself off when PostHog cannot start", async () => {
    posthog.init.mockImplementation(() => {
      throw new Error("blocked");
    });
    const analytics = await startAnalytics();
    analytics.track("preview_3d_opened");

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("never lets a PostHog error reach the app", async () => {
    const analytics = await startAnalytics();
    posthog.capture.mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => analytics.track("preview_3d_opened")).not.toThrow();
  });

  it("removes the share-link payload from every URL before an event leaves", async () => {
    await startAnalytics();
    const config = posthog.init.mock.calls[0][1] as Partial<PostHogConfig>;
    const beforeSend = config.before_send as (event: CaptureResult) => CaptureResult;
    const event = {
      uuid: "1",
      event: "$pageview",
      properties: {
        $current_url: "https://gridfinitylayout.com/?share=abc123&utm_source=reddit",
        $referrer: "https://gridfinitylayout.com/?share=xyz",
        $pathname: "/",
        drawers: 2,
      },
    } as CaptureResult;

    expect(beforeSend(event).properties).toEqual({
      $current_url: "https://gridfinitylayout.com/?utm_source=reddit",
      $referrer: "https://gridfinitylayout.com/",
      $pathname: "/",
      drawers: 2,
    });
  });

  it("records a visit that opens a share link", async () => {
    const shareUrl = buildShareUrl("https://gridfinitylayout.com/", {
      drawerSize: { width: 20, height: 15 },
      selectedPrinter: "Bambu Lab A1",
      customPrinterSize: null,
      useHalfSize: false,
      preferHalfSize: false,
      preferUniformBaseplates: false,
      numDrawers: 2,
      useMm: true,
      bins: [bin("b1", "Allen keys")],
    });
    window.history.replaceState(null, "", new URL(shareUrl).search);
    await startAnalytics();

    expect(captured()).toEqual([
      [
        "layout_loaded",
        {
          source: "share_link",
          drawer_width_mm: 508,
          drawer_depth_mm: 381,
          units: "mm",
          printer: "Bambu Lab A1",
          drawers: 2,
          bins: 1,
        },
      ],
    ]);
  });
});

describe("layout events", () => {
  it("counts the first layout change of a visit as created and later ones as edits", async () => {
    const analytics = await startAnalytics();
    const now = vi.spyOn(Date, "now").mockReturnValue(10_000);
    visitorUsesThePage();

    analytics.trackLayoutChange("drawer_size");
    analytics.trackLayoutChange("drawer_size");
    analytics.trackLayoutChange("printer");
    now.mockReturnValue(12_000);
    analytics.trackLayoutChange("drawer_size");

    expect(captured()).toEqual([
      ["layout_created", { change: "drawer_size" }],
      ["layout_edited", { change: "printer" }],
      ["layout_edited", { change: "drawer_size" }],
    ]);
  });

  it("ignores layout changes made before the visitor has touched the page", async () => {
    const analytics = await startAnalytics();
    analytics.trackLayoutChange("drawer_size");

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("does not count the settings a loaded layout applies as edits", async () => {
    const analytics = await startAnalytics();
    visitorUsesThePage();

    analytics.trackLayoutLoaded("saved", snapshot());
    analytics.trackLayoutChange("printer");
    analytics.trackLayoutChange("drawer_size");
    expect(captured()).toEqual([
      [
        "layout_loaded",
        {
          source: "saved",
          drawer_width_mm: 381,
          drawer_depth_mm: 305,
          units: "in",
          printer: "Bambu Lab A1",
          drawers: 1,
          bins: 1,
        },
      ],
    ]);

    await nextTask();
    analytics.trackLayoutChange("printer");
    expect(eventNames()).toEqual(["layout_loaded", "layout_created"]);
  });

  it("reports how many bins an edit added", async () => {
    const analytics = await startAnalytics();
    visitorUsesThePage();
    const [a, b, c, d] = ["a", "b", "c", "d"].map((id) => bin(id));

    analytics.trackBinsCommitted([a], [a, b, c, d]);
    analytics.trackBinsCommitted([a, b, c, d], [a, b]);

    expect(captured()).toEqual([
      ["bins_added", { count: 3, total: 4 }],
      ["layout_created", { change: "bins" }],
    ]);
  });

  it("tracks the settings a person changes, not the ones they leave alone", async () => {
    const analytics = await startAnalytics();
    visitorUsesThePage();
    const setNumDrawers = vi.fn();
    const setDrawerSize = vi.fn();
    const tracked = analytics.withLayoutTracking({
      numDrawers: 2,
      setNumDrawers,
      drawerSize: { width: 10, height: 8 },
      setDrawerSize,
    } as unknown as GridfinitySettings);
    const widen = (size: DrawerSize) => ({ ...size, width: 12 });

    tracked.setNumDrawers(2);
    expect(posthog.capture).not.toHaveBeenCalled();
    tracked.setNumDrawers(3);
    tracked.setDrawerSize(widen as unknown as DrawerSize);

    expect(setNumDrawers.mock.calls).toEqual([[2], [3]]);
    expect(setDrawerSize).toHaveBeenCalledWith(widen);
    expect(captured()).toEqual([
      ["layout_created", { change: "drawer_count" }],
      ["layout_edited", { change: "drawer_size" }],
    ]);
  });

  it("leaves the settings untouched when analytics is off", async () => {
    const analytics = await loadAnalytics();
    await analytics.initAnalytics();
    const settings = { setNumDrawers: vi.fn() } as unknown as GridfinitySettings;

    expect(analytics.withLayoutTracking(settings)).toBe(settings);
  });

  it("wraps every setter except units, test fit, estimates, and bins, which the bin editor tracks", async () => {
    const analytics = await startAnalytics();
    const settings = renderHook(() => useGridfinitySettings()).result.current;
    const tracked = analytics.withLayoutTracking(settings);
    const setters = (Object.keys(settings) as Array<keyof GridfinitySettings>).filter((key) =>
      key.startsWith("set")
    );

    expect(setters.filter((key) => tracked[key] === settings[key]).sort()).toEqual([
      "setBins",
      "setEstimateSettings",
      "setTestFit",
      "setUseMm",
    ]);
  });
});

describe("event properties", () => {
  it("summarizes a layout in millimetres without any text the person typed", async () => {
    const { layoutSummary } = await loadAnalytics();

    expect(
      layoutSummary({
        drawerSize: { width: 22.5, height: 16.5 },
        useMm: false,
        selectedPrinter: "custom printer",
        numDrawers: 3,
        bins: [bin("b1", "Spare screws")],
      })
    ).toEqual({
      drawer_width_mm: 572,
      drawer_depth_mm: 419,
      units: "in",
      printer: "Custom Printer",
      drawers: 3,
      bins: 1,
    });
  });

  it("describes a download by its parts and options", async () => {
    const analytics = await startAnalytics();

    analytics.trackFilesDownloaded(
      {
        layout: [piece("baseplate"), piece("half-size"), piece("spacer")],
        bins: [bin("a"), bin("b")],
        numDrawers: 2,
        drawerSize: { width: 10, height: 10 },
        useMm: true,
        printerName: "Bambu Lab A1",
        printerSize: { x: 256, y: 256, z: 256 },
        testFit: true,
        labelTabs: false,
        dividerCount: 2,
        lids: true,
        magnets: false,
        screws: true,
        scoop: true,
      },
      { parts: 5, prints: 3, skippedBins: 1 }
    );

    expect(captured()).toEqual([
      [
        "files_downloaded",
        {
          drawer_width_mm: 254,
          drawer_depth_mm: 254,
          units: "mm",
          printer: "Bambu Lab A1",
          drawers: 2,
          bins: 2,
          baseplates: 4,
          spacers: 2,
          parts: 5,
          prints: 3,
          skipped_bins: 1,
          test_fit: true,
          label_tabs: false,
          dividers: 2,
          lids: true,
          magnets: false,
          screws: true,
          scoop: true,
        },
      ],
    ]);
  });
});
