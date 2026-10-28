/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EstimateSettings from './EstimateSettings';
import {
  DEFAULT_ESTIMATE_SETTINGS,
  type EstimateSettings as EstimateSettingsType,
} from '@/utils/partVolumes';

const Harness = ({ onChange }: { onChange: (settings: EstimateSettingsType) => void }) => {
  const [settings, setSettings] = useState<EstimateSettingsType>(DEFAULT_ESTIMATE_SETTINGS);
  return (
    <EstimateSettings
      settings={settings}
      onChange={(next) => {
        setSettings(next);
        onChange(next);
      }}
    />
  );
};

const openSettings = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Estimate settings' }));
  return user;
};

const priceInput = () => screen.getByRole('textbox', { name: /Filament price/ });
const flowInput = () => screen.getByRole('textbox', { name: /Print speed/ });

describe('EstimateSettings', () => {
  it('shows the current material, price, and flow', async () => {
    render(<Harness onChange={vi.fn()} />);
    await openSettings();
    expect(screen.getByRole('button', { name: 'PLA' })).toHaveAttribute('aria-pressed', 'true');
    expect(priceInput()).toHaveValue('20');
    expect(flowInput()).toHaveValue('8');
    expect(screen.getByRole('button', { name: 'Reset to defaults' })).toBeDisabled();
  });

  it('switches material and reports the new settings', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await openSettings();
    await userEvent.setup().click(screen.getByRole('button', { name: 'PETG' }));
    expect(onChange).toHaveBeenLastCalledWith({
      material: 'PETG',
      priceUsdPerKg: 20,
      flowMm3PerS: 8,
    });
    expect(screen.getByRole('button', { name: 'Reset to defaults' })).toBeEnabled();
  });

  it('commits a new price on blur', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const user = await openSettings();
    await user.clear(priceInput());
    await user.type(priceInput(), '25');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({
      material: 'PLA',
      priceUsdPerKg: 25,
      flowMm3PerS: 8,
    });
    expect(priceInput()).toHaveValue('25');
  });

  it('commits a new flow rate on Enter', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const user = await openSettings();
    await user.clear(flowInput());
    await user.type(flowInput(), '12{Enter}');
    expect(onChange).toHaveBeenLastCalledWith({
      material: 'PLA',
      priceUsdPerKg: 20,
      flowMm3PerS: 12,
    });
  });

  it('clamps out-of-range numbers to the allowed range', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const user = await openSettings();
    await user.clear(priceInput());
    await user.type(priceInput(), '500');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({
      material: 'PLA',
      priceUsdPerKg: 200,
      flowMm3PerS: 8,
    });
    await user.clear(flowInput());
    await user.type(flowInput(), '0');
    await user.tab();
    expect(onChange).toHaveBeenLastCalledWith({
      material: 'PLA',
      priceUsdPerKg: 200,
      flowMm3PerS: 1,
    });
  });

  it('rejects non-numeric input and keeps the old value', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const user = await openSettings();
    await user.clear(priceInput());
    await user.type(priceInput(), 'abc');
    await user.tab();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a number')).toBeInTheDocument();
    expect(priceInput()).toHaveValue('20');
  });

  it('resets to defaults', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const user = await openSettings();
    await user.click(screen.getByRole('button', { name: 'ABS' }));
    expect(onChange).toHaveBeenLastCalledWith({
      material: 'ABS',
      priceUsdPerKg: 20,
      flowMm3PerS: 8,
    });
    await user.click(screen.getByRole('button', { name: 'Reset to defaults' }));
    expect(onChange).toHaveBeenLastCalledWith(DEFAULT_ESTIMATE_SETTINGS);
  });
});
