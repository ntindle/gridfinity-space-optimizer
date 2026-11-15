/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './segmented-control';

describe('SegmentedControl', () => {
  it('exposes a labelled group of toggle buttons and reports the chosen value', async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    render(
      <SegmentedControl
        aria-label="Units"
        value="in"
        onValueChange={onValueChange}
        options={[
          { value: 'in', label: 'in', srLabel: 'inches' },
          { value: 'mm', label: 'mm', srLabel: 'millimeters' },
        ]}
      />
    );

    expect(screen.getByRole('group', { name: 'Units' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'in inches' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'mm millimeters' })).toHaveAttribute('aria-pressed', 'false');

    await user.click(screen.getByRole('button', { name: 'mm millimeters' }));
    expect(onValueChange).toHaveBeenCalledWith('mm');
  });
});
