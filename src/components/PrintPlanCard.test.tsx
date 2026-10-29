/**
 * @vitest-environment jsdom
 */
import { useState, type FC } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { collectPrintParts, testFitParts } from '@/utils/printParts';
import {
  DEFAULT_ESTIMATE_SETTINGS,
  estimatePrint,
  formatEstimateDuration,
  formatEstimateGrams,
  type EstimateSettings,
} from '@/utils/partVolumes';
import PrintPlanCard from './PrintPlanCard';
import { buildPrintListText } from '@/utils/printList';
import { planPlates } from '@/utils/printPlan';
import type { DrawerSize, PrinterSize } from '@/types';

const A1: PrinterSize = { x: 256, y: 256, z: 256 };
const drawer: DrawerSize = { width: 8, height: 4 };
const layout = calculateGrids(drawer, A1, false, false).layout;

const props = {
  layout,
  bins: [],
  numDrawers: 1,
  useMm: false,
  printerName: 'Bambu Lab A1',
  printerSize: A1,
  labelTabs: false,
};

const StatefulCard: FC<{
  initialTestFit?: boolean;
  onTestFitChange?: (value: boolean) => void;
  initialEstimateSettings?: EstimateSettings;
  onEstimateSettingsChange?: (settings: EstimateSettings) => void;
  overrides?: Partial<typeof props>;
}> = ({
  initialTestFit = false,
  onTestFitChange,
  initialEstimateSettings = DEFAULT_ESTIMATE_SETTINGS,
  onEstimateSettingsChange,
  overrides = {},
}) => {
  const [testFit, setTestFit] = useState(initialTestFit);
  const [estimateSettings, setEstimateSettings] = useState(initialEstimateSettings);
  return (
    <PrintPlanCard
      {...props}
      {...overrides}
      testFit={testFit}
      onTestFitChange={(value) => {
        setTestFit(value);
        onTestFitChange?.(value);
      }}
      estimateSettings={estimateSettings}
      onEstimateSettingsChange={(settings) => {
        setEstimateSettings(settings);
        onEstimateSettingsChange?.(settings);
      }}
    />
  );
};

describe('PrintPlanCard', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    writeText.mockResolvedValue(undefined);
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  it('renders the heading, the summary, and one row per plate', () => {
    render(<StatefulCard />);
    expect(screen.getByRole('heading', { name: 'Print plan' })).toBeInTheDocument();
    expect(screen.getByText(/Bambu Lab A1 \(256 × 256 mm\)/)).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    expect(screen.getByText(/Baseplate/)).toBeInTheDocument();
  });

  it('numbers plates and notes repeated prints', () => {
    render(<StatefulCard overrides={{ numDrawers: 2 }} />);
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 2, printerSize: A1 });
    const total = parts.reduce((sum, part) => sum + part.count, 0);
    expect(screen.getByText(new RegExp(`${total} parts on`))).toBeInTheDocument();
  });

  it('shows the print estimate for the parts in the plan', () => {
    render(<StatefulCard />);
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    const estimate = estimatePrint(parts);
    expect(
      screen.getByText(new RegExp(`~${formatEstimateDuration(estimate.minutes)}`))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`~${formatEstimateGrams(estimate.grams)} PLA`))
    ).toBeInTheDocument();
    expect(screen.getByText(/Rough estimate/)).toBeInTheDocument();
    expect(screen.getByText(/1\.24 g\/cm³/)).toBeInTheDocument();
  });

  it('includes the test-fit pieces in the estimate when the switch is on', () => {
    render(<StatefulCard />);
    fireEvent.click(screen.getByRole('switch', { name: 'Test fit first' }));
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    const merged = new Map(parts.map((part) => [part.key, part]));
    for (const testPart of testFitParts(parts)) {
      const existing = merged.get(testPart.key);
      merged.set(
        testPart.key,
        existing ? { ...existing, count: existing.count + testPart.count } : testPart
      );
    }
    const estimate = estimatePrint([...merged.values()]);
    expect(
      screen.getByText(new RegExp(`~${formatEstimateDuration(estimate.minutes)}`))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`~${formatEstimateGrams(estimate.grams)} PLA`))
    ).toBeInTheDocument();
  });

  it('recomputes the estimate from the chosen material, price, and flow', async () => {
    const user = userEvent.setup();
    render(
      <StatefulCard
        initialEstimateSettings={{
          material: 'PETG',
          priceUsdPerKg: 25,
          flowMm3PerS: 10,
        }}
      />
    );
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    const estimate = estimatePrint(parts, {
      material: 'PETG',
      priceUsdPerKg: 25,
      flowMm3PerS: 10,
    });
    expect(
      screen.getByText(new RegExp(`~${formatEstimateDuration(estimate.minutes)}`))
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`~${formatEstimateGrams(estimate.grams)} PETG`))
    ).toBeInTheDocument();
    expect(screen.getByText(/PETG at 1\.27 g\/cm³, \$25\/kg, ~10 mm³\/s/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Estimate settings' }));
    await user.click(screen.getByRole('button', { name: 'ABS' }));
    const absEstimate = estimatePrint(parts, {
      material: 'ABS',
      priceUsdPerKg: 25,
      flowMm3PerS: 10,
    });
    expect(
      screen.getByText(new RegExp(`~${formatEstimateGrams(absEstimate.grams)} ABS`))
    ).toBeInTheDocument();
    expect(screen.getByText(/ABS at 1\.04 g\/cm³, \$25\/kg, ~10 mm³\/s/)).toBeInTheDocument();
  });

  it('copies one line per part and shows confirmation', async () => {
    render(<StatefulCard />);
    fireEvent.click(screen.getByRole('button', { name: /copy list/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    const copied = writeText.mock.calls[0][0] as string;
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    expect(copied.split('\n')).toHaveLength(parts.length + 1);
    expect(copied).toContain('Print plan · 1 drawer · Bambu Lab A1');
    expect(copied).toMatch(/× Baseplate .* \(.*\)/);
    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('shows an error state when copying fails', async () => {
    writeText.mockRejectedValueOnce(new Error('denied'));
    Object.defineProperty(document, 'execCommand', { value: undefined, configurable: true });
    render(<StatefulCard />);
    fireEvent.click(screen.getByRole('button', { name: /copy list/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy failed/i })).toBeInTheDocument();
    });
  });

  it('renders nothing when there is nothing to print', () => {
    const { container } = render(<StatefulCard overrides={{ layout: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the test-fit switch off by default with no test plate', () => {
    render(<StatefulCard />);
    const toggle = screen.getByRole('switch', { name: 'Test fit first' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText('Test fit')).not.toBeInTheDocument();
  });

  it('adds a Test fit plate first and includes it in the counts', () => {
    render(<StatefulCard />);
    fireEvent.click(screen.getByRole('switch', { name: 'Test fit first' }));
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    const plates = planPlates(
      parts.map(({ key, width, depth, count }) => ({ key, width, depth, count })),
      A1
    );
    const total = parts.reduce((sum, part) => sum + part.count, 0);
    const rows = screen.getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Test fit');
    expect(rows[0]).toHaveTextContent('Baseplate 1 × 1');
    expect(rows[0]).toHaveTextContent('Spacer');
    expect(screen.getByText(new RegExp(`${total + 2} parts on`))).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`on ${plates.length + 1} plates`))
    ).toBeInTheDocument();
  });

  it('shows the test-fit plate when the switch starts on', () => {
    render(<StatefulCard initialTestFit />);
    expect(screen.getByRole('switch', { name: 'Test fit first' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByText('Test fit')).toBeInTheDocument();
  });

  it('reports the switch change to its parent', () => {
    const onTestFitChange = vi.fn();
    render(<StatefulCard onTestFitChange={onTestFitChange} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Test fit first' }));
    expect(onTestFitChange).toHaveBeenCalledWith(true);
  });

  it('copies the test-fit pieces with the list when on', async () => {
    render(<StatefulCard />);
    fireEvent.click(screen.getByRole('switch', { name: 'Test fit first' }));
    fireEvent.click(screen.getByRole('button', { name: /copy list/i }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    const copied = writeText.mock.calls[0][0] as string;
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 1, printerSize: A1 });
    const spacer = parts
      .filter((part) => part.kind === 'spacer')
      .sort((a, b) => a.key.localeCompare(b.key))[0];
    expect(copied.split('\n')).toHaveLength(parts.length + 2);
    expect(copied).toMatch(/1 × Baseplate 1 × 1 \(/);
    expect(copied).toContain(`${spacer.count + 1} × ${spacer.label}`);
  });
});

describe('buildPrintListText', () => {
  it('formats the header and one line per part', () => {
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 2, printerSize: A1 });
    const text = buildPrintListText(parts, {
      numDrawers: 2,
      printerName: 'Bambu Lab A1',
      useMm: true,
    });
    const lines = text.split('\n');
    expect(lines[0]).toBe('Print plan · 2 drawers · Bambu Lab A1');
    expect(lines).toHaveLength(parts.length + 1);
    expect(lines[1]).toMatch(/^\d+ × .+ \(.+ mm × .+ mm\)$/);
  });
});
