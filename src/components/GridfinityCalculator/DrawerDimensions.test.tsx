/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DrawerDimensions from './DrawerDimensions';
import type { DrawerSize } from '@/types';

const Harness = ({
  initial = { width: 22.5, height: 16.5 },
  useMm = false,
  onChange,
}: {
  initial?: DrawerSize;
  useMm?: boolean;
  onChange: (size: DrawerSize) => void;
}) => {
  const [size, setSize] = useState<DrawerSize>(initial);
  return (
    <DrawerDimensions
      drawerSize={size}
      useMm={useMm}
      setDrawerSize={(update) =>
        setSize((prev) => {
          const next = typeof update === 'function' ? update(prev) : update;
          onChange(next);
          return next;
        })
      }
    />
  );
};

const width = () => screen.getByRole('textbox', { name: /^Width/ });
const depth = () => screen.getByRole('textbox', { name: /^Depth/ });

describe('DrawerDimensions', () => {
  it('labels the inputs width and depth with the unit for screen readers', () => {
    render(<Harness onChange={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Width (inches)' })).toHaveValue('22.5');
    expect(screen.getByRole('textbox', { name: 'Depth (inches)' })).toHaveValue('16.5');
  });

  it('commits on Enter without leaving the field', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.clear(width());
    await user.type(width(), '30{Enter}');

    expect(onChange).toHaveBeenLastCalledWith({ width: 30, height: 16.5 });
    expect(width()).toHaveFocus();
  });

  it('accepts a comma as the decimal separator', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.clear(depth());
    await user.type(depth(), '12,75');
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith({ width: 22.5, height: 12.75 });
  });

  it('rejects a size larger than a share link can carry', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.clear(width());
    await user.type(width(), '250');
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(width()).toHaveAttribute('aria-invalid', 'true');
    expect(width()).toHaveAccessibleDescription('Up to 200 in');
  });

  it('states the limit in millimetres when entering millimetres', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness useMm onChange={onChange} />);

    expect(width()).toHaveValue('571.5');
    await user.clear(width());
    await user.type(width(), '6000');
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Up to 5080 mm')).toBeInTheDocument();
  });

  it('keeps the previous size and explains when the text is not a number', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.clear(width());
    await user.type(width(), 'abc');
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a number, like 22.5')).toBeInTheDocument();

    await user.type(width(), '1');
    expect(screen.queryByText('Enter a number, like 22.5')).not.toBeInTheDocument();
  });

  it('clears the dimension to zero when emptied', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.clear(width());
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith({ width: 0, height: 16.5 });
  });

  it('does not re-save an unchanged value, so toggling units never drifts', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness useMm initial={{ width: 17.125, height: 16.5 }} onChange={onChange} />);

    expect(width()).toHaveValue('434.98');
    await user.click(width());
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('rounds long inch values for display', () => {
    render(<Harness initial={{ width: 23.62204724409449, height: 16.5 }} onChange={vi.fn()} />);
    expect(width()).toHaveValue('23.622');
  });
});
