/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MobileResultsBar from './MobileResultsBar';
import type { CalculationResultWithDrawers } from '@/hooks/useGridfinityCalculation';

const makeResult = (
  overrides: Partial<CalculationResultWithDrawers> = {}
): CalculationResultWithDrawers =>
  ({
    baseplates: { '4x3': 2 },
    halfSizeBins: { '2x1': 4 },
    spacers: { '10mm': 1 },
    numDrawers: 2,
    ...overrides,
  }) as CalculationResultWithDrawers;

describe('MobileResultsBar', () => {
  it('renders per-category counts scaled by the drawer multiplier', () => {
    render(<MobileResultsBar result={makeResult()} binCount={3} />);
    expect(
      screen.getByText('6 bins · 12 baseplates · 2 spacers')
    ).toBeInTheDocument();
  });

  it('uses singular forms for a count of one and omits empty categories', () => {
    render(
      <MobileResultsBar
        result={makeResult({
          baseplates: { '2x2': 1 },
          halfSizeBins: {},
          spacers: {},
          numDrawers: 1,
        })}
      />
    );
    expect(screen.getByText('1 baseplate')).toBeInTheDocument();
  });

  it('scrolls to the results section when View results is clicked', async () => {
    const user = userEvent.setup();
    const scrollIntoView = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    const anchor = document.createElement('div');
    anchor.id = 'calculator-results';
    document.body.appendChild(anchor);

    render(<MobileResultsBar result={makeResult()} />);
    await user.click(screen.getByRole('button', { name: 'View results' }));

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    document.body.removeChild(anchor);
  });

  it('is mobile-only and hidden in print', () => {
    const { container } = render(<MobileResultsBar result={makeResult()} />);
    const bar = container.firstElementChild as HTMLElement;
    expect(bar.className).toContain('md:hidden');
    expect(bar.className).toContain('print:hidden');
  });

  it('counts half-size baseplates as baseplates and only shows bins you placed', () => {
    render(<MobileResultsBar result={makeResult()} />);
    expect(screen.getByText('12 baseplates · 2 spacers')).toBeInTheDocument();
    expect(screen.queryByText(/bin/)).not.toBeInTheDocument();
  });

  it('shows the Layout ready fallback when no pieces are counted', () => {
    render(
      <MobileResultsBar
        result={makeResult({
          baseplates: {},
          halfSizeBins: {},
          spacers: {},
        })}
      />
    );
    expect(screen.getByText('Layout ready')).toBeInTheDocument();
  });
});
