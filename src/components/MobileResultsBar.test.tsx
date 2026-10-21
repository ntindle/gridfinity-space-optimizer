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
    render(<MobileResultsBar result={makeResult()} />);
    expect(
      screen.getByText('4 baseplates · 8 bins · 2 spacers')
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
});
