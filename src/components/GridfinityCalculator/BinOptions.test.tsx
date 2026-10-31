/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BinOptions from './BinOptions';

const renderOptions = (overrides: Partial<ComponentProps<typeof BinOptions>> = {}) => {
  const props = {
    useHalfSize: false,
    setUseHalfSize: vi.fn(),
    preferHalfSize: false,
    setPreferHalfSize: vi.fn(),
    preferUniformBaseplates: false,
    setPreferUniformBaseplates: vi.fn(),
    labelTabs: false,
    setLabelTabs: vi.fn(),
    dividers: false,
    setDividers: vi.fn(),
    lids: false,
    setLids: vi.fn(),
    ...overrides,
  };
  render(<BinOptions {...props} />);
  return props;
};

describe('BinOptions', () => {
  it('describes each option on its switch', () => {
    renderOptions();
    expect(screen.getByRole('switch', { name: 'Half-size grid' })).toHaveAccessibleDescription(
      /21 × 21 mm grid/
    );
    expect(screen.getByRole('switch', { name: 'Uniform baseplates' })).toBeEnabled();
  });

  it('turns the gap filler off when the half-size grid is switched on', async () => {
    const user = userEvent.setup();
    const props = renderOptions({ preferHalfSize: true });

    await user.click(screen.getByRole('switch', { name: 'Half-size grid' }));

    expect(props.setUseHalfSize).toHaveBeenCalledWith(true);
    expect(props.setPreferHalfSize).toHaveBeenCalledWith(false);
  });

  it('toggles label tabs on bins', async () => {
    const user = userEvent.setup();
    const props = renderOptions();

    await user.click(screen.getByRole('switch', { name: 'Label tabs on bins' }));

    expect(props.setLabelTabs).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch', { name: 'Label tabs on bins' })).toHaveAccessibleDescription(
      /raised tab above the stacking lip/
    );
  });

  it('toggles dividers in bins', async () => {
    const user = userEvent.setup();
    const props = renderOptions();

    await user.click(screen.getByRole('switch', { name: 'Dividers in bins' }));

    expect(props.setDividers).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch', { name: 'Dividers in bins' })).toHaveAccessibleDescription(
      /down the middle of its long side/
    );
  });

  it('toggles lids for bins', async () => {
    const user = userEvent.setup();
    const props = renderOptions();

    await user.click(screen.getByRole('switch', { name: 'Lids for bins' }));

    expect(props.setLids).toHaveBeenCalledWith(true);
    expect(screen.getByRole('switch', { name: 'Lids for bins' })).toHaveAccessibleDescription(
      /flat 3 mm cover lid/
    );
  });

  it('disables uniform baseplates on a half-size grid, since it has no effect', () => {
    renderOptions({ useHalfSize: true, preferUniformBaseplates: true });
    const uniform = screen.getByRole('switch', { name: 'Uniform baseplates' });

    expect(uniform).toBeDisabled();
    expect(uniform).not.toBeChecked();
    expect(uniform).toHaveAccessibleDescription('Not used with a half-size grid.');
  });
});
