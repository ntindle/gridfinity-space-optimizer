/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BinDetails from './BinDetails';
import type { Bin } from '@/types';

const bin: Bin = {
  id: 'b1',
  x: 0,
  y: 0,
  width: 84,
  depth: 42,
  height: 3,
  label: 'Screws',
};

const renderDetails = (overrides: Partial<ComponentProps<typeof BinDetails>> = {}) => {
  const props = {
    bin,
    step: 21,
    maxHeight: 20,
    useMm: true,
    dividerCount: 0,
    canResize: () => true,
    onChange: vi.fn(),
    onDuplicate: vi.fn(),
    onDelete: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<BinDetails {...props} />);
  return props;
};

describe('BinDetails divider positions', () => {
  it('hides divider positions when dividers are off', () => {
    renderDetails({ dividerCount: 0 });
    expect(screen.queryByText('Divider positions')).toBeNull();
  });

  it('shows one stepper per divider at the even positions', () => {
    renderDetails({ dividerCount: 2 });
    expect(screen.getByText('Divider positions')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Divider 1' })).toHaveTextContent('33%');
    expect(screen.getByRole('group', { name: 'Divider 2' })).toHaveTextContent('67%');
  });

  it('moves a divider by five percent per step', async () => {
    const user = userEvent.setup();
    const props = renderDetails({ dividerCount: 1 });
    await user.click(
      screen.getByRole('button', { name: 'Divider 1 away from the label-tab edge' })
    );
    expect(props.onChange).toHaveBeenCalledWith({ ...bin, dividerPositions: [0.55] });
    await user.click(
      screen.getByRole('button', { name: 'Divider 1 toward the label-tab edge' })
    );
    expect(props.onChange).toHaveBeenCalledWith({ ...bin, dividerPositions: [0.45] });
  });

  it('keeps dividers apart and inside the bin', async () => {
    const user = userEvent.setup();
    const props = renderDetails({
      dividerCount: 2,
      bin: { ...bin, dividerPositions: [0.5, 0.55] },
    });
    expect(
      screen.getByRole('button', { name: 'Divider 1 away from the label-tab edge' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Divider 2 toward the label-tab edge' })
    ).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: 'Divider 1 toward the label-tab edge' })
    );
    expect(props.onChange).toHaveBeenCalledWith({ ...bin, dividerPositions: [0.45, 0.55] });
  });

  it('measures tall bins from the left edge in the preview', async () => {
    const user = userEvent.setup();
    const tallBin: Bin = { ...bin, width: 42, depth: 84 };
    const props = renderDetails({ dividerCount: 1, bin: tallBin });
    expect(
      screen.getByText("Measured across the bin's short side, from the left edge in the preview.")
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Divider 1 away from the left edge in the preview' })
    );
    expect(props.onChange).toHaveBeenCalledWith({ ...tallBin, dividerPositions: [0.55] });
    await user.click(
      screen.getByRole('button', { name: 'Divider 1 toward the left edge in the preview' })
    );
    expect(props.onChange).toHaveBeenCalledWith({ ...tallBin, dividerPositions: [0.45] });
  });
});
