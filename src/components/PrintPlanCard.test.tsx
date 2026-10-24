/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { calculateGrids } from '@/utils/gridfinityUtils';
import { collectPrintParts } from '@/utils/printParts';
import PrintPlanCard from './PrintPlanCard';
import { buildPrintListText } from '@/utils/printList';
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
