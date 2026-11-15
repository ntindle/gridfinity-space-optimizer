/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GridfinityResults from './GridfinityResults';
import type { CalculationResultWithDrawers } from '@/hooks/useGridfinityCalculation';

const result = (overrides: Partial<CalculationResultWithDrawers> = {}): CalculationResultWithDrawers => ({
  baseplates: { '6x6': 2, '1x6': 1 },
  halfSizeBins: {},
  spacers: { '25.5mm x 252mm': 1 },
  numDrawers: 1,
  ...overrides,
});

describe('GridfinityResults', () => {
  it('headlines the totals to print with the drawer count and size', () => {
    render(
      <GridfinityResults
        result={result({ numDrawers: 3 })}
        useMm={false}
        drawerSize={{ width: 22.5, height: 16.5 }}
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Results for 3 drawers · 22.5 × 16.5 in' })
    ).toBeInTheDocument();
    expect(screen.getByText('9 baseplates · 3 spacers')).toBeInTheDocument();
  });

  it('counts half-size pieces as baseplates and leads with the placed bins', () => {
    render(
      <GridfinityResults
        result={result({ baseplates: {}, halfSizeBins: { '12x12': 2 }, numDrawers: 2 })}
        useMm={false}
        binCount={5}
      />
    );
    expect(screen.getByText('10 bins · 4 baseplates · 2 spacers')).toBeInTheDocument();
  });

  it('explains a drawer too small for a single grid cell', () => {
    render(<GridfinityResults result={result({ baseplates: {} })} useMm={false} />);
    expect(screen.getByText('1 spacer')).toBeInTheDocument();
    expect(screen.getByText(/smaller than one grid cell/)).toBeInTheDocument();
  });

  it('renders the action slot next to the summary', () => {
    render(
      <GridfinityResults result={result()} useMm={false} action={<button type="button">Act</button>} />
    );
    expect(screen.getByRole('button', { name: 'Act' })).toBeInTheDocument();
  });
});
