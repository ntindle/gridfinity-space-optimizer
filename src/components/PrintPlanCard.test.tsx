/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { collectPrintParts } from '@/utils/printParts';
import PrintPlanCard, { TEST_FIT_STORAGE_KEY } from './PrintPlanCard';
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
    render(<PrintPlanCard {...props} />);
    expect(screen.getByRole('heading', { name: 'Print plan' })).toBeInTheDocument();
    expect(screen.getByText(/Bambu Lab A1 \(256 × 256 mm\)/)).toBeInTheDocument();
    const rows = screen.getAllByRole('listitem');
    expect(rows.length).toBeGreaterThan(0);
    expect(screen.getByText(/Baseplate/)).toBeInTheDocument();
  });

  it('numbers plates and notes repeated prints', () => {
    render(<PrintPlanCard {...props} numDrawers={2} />);
    const { parts } = collectPrintParts({ layout, bins: [], numDrawers: 2, printerSize: A1 });
    const total = parts.reduce((sum, part) => sum + part.count, 0);
    expect(screen.getByText(new RegExp(`${total} parts on`))).toBeInTheDocument();
  });

  it('copies one line per part and shows confirmation', async () => {
    render(<PrintPlanCard {...props} />);
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
    render(<PrintPlanCard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /copy list/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy failed/i })).toBeInTheDocument();
    });
  });

  it('renders nothing when there is nothing to print', () => {
    const { container } = render(<PrintPlanCard {...props} layout={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the test-fit switch off by default with no test plate', () => {
    render(<PrintPlanCard {...props} />);
    const toggle = screen.getByRole('switch', { name: 'Test fit first' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(screen.queryByText('Test fit')).not.toBeInTheDocument();
  });

  it('adds a Test fit plate first and includes it in the counts', () => {
    render(<PrintPlanCard {...props} />);
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

  it('persists the test-fit switch across renders', () => {
    const { unmount } = render(<PrintPlanCard {...props} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Test fit first' }));
    expect(localStorage.setItem).toHaveBeenCalledWith(TEST_FIT_STORAGE_KEY, 'true');
    vi.mocked(localStorage.getItem).mockReturnValueOnce('true');
    unmount();
    render(<PrintPlanCard {...props} />);
    expect(screen.getByRole('switch', { name: 'Test fit first' })).toHaveAttribute(
      'aria-checked',
      'true'
    );
    expect(screen.getByText('Test fit')).toBeInTheDocument();
  });

  it('copies the test-fit pieces with the list when on', async () => {
    render(<PrintPlanCard {...props} />);
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
