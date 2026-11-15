/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DrawerPresets from './DrawerPresets';
import { DRAWER_PRESETS } from '@/lib/drawerPresets';
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
    <DrawerPresets
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

const presetSelect = () =>
  screen.getByRole('combobox', { name: 'Drawer preset' });

describe('DrawerPresets', () => {
  it('shows Custom size when the dims match no preset', () => {
    render(<Harness onChange={vi.fn()} />);
    expect(presetSelect()).toHaveValue('');
    expect(
      within(presetSelect()).getByRole('option', { name: 'Custom size' })
    ).toBeInTheDocument();
    for (const preset of DRAWER_PRESETS) {
      expect(
        within(presetSelect()).getByRole('option', { name: new RegExp(preset.name) })
      ).toBeInTheDocument();
    }
  });

  it('shows the matching preset when the dims are a preset size', () => {
    render(<Harness initial={{ width: 11.5, height: 20.6 }} onChange={vi.fn()} />);
    expect(presetSelect()).toHaveValue('ikea-alex');
    expect(screen.getByRole('link', { name: /IKEA ALEX drawer unit/ })).toHaveAttribute(
      'href',
      'https://theworkspacehero.com/alex-drawer-dimensions/'
    );
  });

  it('sets the drawer dims when a preset is picked', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.selectOptions(presetSelect(), 'husky-52-full-length');

    expect(onChange).toHaveBeenLastCalledWith({ width: 47.6, height: 15.8 });
    expect(presetSelect()).toHaveValue('husky-52-full-length');
  });

  it('shows preset sizes in millimetres when the units are millimetres', () => {
    render(<Harness useMm onChange={vi.fn()} />);
    expect(
      within(presetSelect()).getByRole('option', { name: /292\.1 × 523\.2 mm/ })
    ).toBeInTheDocument();
  });
});
