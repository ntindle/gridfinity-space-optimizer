/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MeasureGuide from './MeasureGuide';

const STEP_TITLES = [
  'Measure the inside, not the outside',
  'Measure at the bottom',
  'Subtract what steals space',
  'Measure twice, enter once',
  'Enter in the units you measured',
];

describe('MeasureGuide', () => {
  it('renders a collapsed measurement guide next to the dimension inputs', () => {
    const { container } = render(<MeasureGuide />);
    expect(
      screen.getByText('How to measure your drawer', { selector: 'summary' }),
    ).toBeInTheDocument();
    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute('open');
  });

  it('expands to show all five measurement steps', () => {
    const { container } = render(<MeasureGuide />);
    fireEvent.click(screen.getByText('How to measure your drawer', { selector: 'summary' }));
    expect(container.querySelector('details')).toHaveAttribute('open');
    for (const title of STEP_TITLES) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it('mentions the inside measurement and the unit toggle', () => {
    render(<MeasureGuide />);
    fireEvent.click(screen.getByText('How to measure your drawer', { selector: 'summary' }));
    expect(screen.getByText(/between the inner walls/i)).toBeInTheDocument();
    expect(screen.getByText(/Inches\/mm toggle/i)).toBeInTheDocument();
  });
});
