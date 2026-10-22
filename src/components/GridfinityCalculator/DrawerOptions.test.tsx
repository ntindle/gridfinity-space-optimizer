/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DrawerOptions from './DrawerOptions';

const Harness = ({ initial = 1, onChange }: { initial?: number; onChange: (n: number) => void }) => {
  const [count, setCount] = useState(initial);
  return (
    <DrawerOptions
      numDrawers={count}
      setNumDrawers={(next) => {
        onChange(next);
        setCount(next);
      }}
    />
  );
};

const input = () => screen.getByLabelText('Identical drawers');

describe('DrawerOptions', () => {
  it('steps the drawer count with the plus and minus buttons', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    expect(screen.getByRole('button', { name: 'One fewer drawer' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'One more drawer' }));
    await user.click(screen.getByRole('button', { name: 'One more drawer' }));

    expect(onChange).toHaveBeenLastCalledWith(3);
    expect(input()).toHaveValue('3');

    await user.click(screen.getByRole('button', { name: 'One fewer drawer' }));
    expect(input()).toHaveValue('2');
  });

  it('caps the count at 100, the most a share link carries', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={99} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'One more drawer' }));
    expect(screen.getByRole('button', { name: 'One more drawer' })).toBeDisabled();

    await user.clear(input());
    await user.type(input(), '150');
    await user.tab();

    expect(onChange).toHaveBeenLastCalledWith(100);
    expect(input()).toHaveValue('100');
  });

  it('restores the last valid count instead of resetting to 1', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={4} onChange={onChange} />);

    await user.clear(input());
    await user.type(input(), 'x');
    await user.tab();

    expect(input()).toHaveValue('4');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('waits for a whole number before changing the count, then normalizes on blur', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness initial={3} onChange={onChange} />);

    await user.clear(input());
    await user.type(input(), '2.5');
    expect(onChange).toHaveBeenLastCalledWith(2);
    onChange.mockClear();
    await user.tab();

    expect(input()).toHaveValue('2');
    expect(onChange).toHaveBeenLastCalledWith(2);
  });
});
